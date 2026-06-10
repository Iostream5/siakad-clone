-- Run this on the SOURCE Supabase SQL editor or through MCP execute_sql.
-- It returns SQL INSERT statements for public data, selected auth data, and storage metadata.
-- Paste the returned dump_sql after the schema restore section.

create temp table if not exists clone_dump_lines (
  line_no bigserial primary key,
  line text not null
) on commit drop;

truncate clone_dump_lines;

do $$
declare
  r record;
  col_list text;
  val_expr text;
  type_name text;
  data_sql text;
begin
  insert into clone_dump_lines(line) values
    ('set session_replication_role = replica;');

  for r in
    select 'public'::text as schema_name, tablename as table_name, 1 as schema_order
    from pg_tables
    where schemaname = 'public'
    union all
    select 'auth', unnest(array[
      'users',
      'identities',
      'sessions',
      'refresh_tokens',
      'mfa_amr_claims',
      'mfa_factors',
      'mfa_challenges',
      'one_time_tokens'
    ]), 2
    union all
    select 'storage', unnest(array['buckets', 'objects']), 3
    order by schema_order, table_name
  loop
    if to_regclass(format('%I.%I', r.schema_name, r.table_name)) is null then
      continue;
    end if;

    select
      string_agg(format('%I', column_name), ', ' order by ordinal_position),
      string_agg(
        case
          when data_type in ('json', 'jsonb') then
            format(
              'case when %1$I is null then ''NULL'' else quote_literal(%1$I::text) || ''::%2$s'' end',
              column_name,
              data_type
            )
          when data_type = 'ARRAY' then
            format(
              'case when %1$I is null then ''NULL'' else quote_literal(%1$I::text) || ''::%2$s'' end',
              column_name,
              udt_name::regtype::text
            )
          else
            format(
              'case when %1$I is null then ''NULL'' else quote_literal(%1$I::text) end',
              column_name
            )
        end,
        ' || '', '' || '
        order by ordinal_position
      )
    into col_list, val_expr
    from information_schema.columns
    where table_schema = r.schema_name
      and table_name = r.table_name;

    if col_list is null then
      continue;
    end if;

    insert into clone_dump_lines(line)
    values (format('truncate table %I.%I cascade;', r.schema_name, r.table_name));

    data_sql := format(
      'insert into clone_dump_lines(line)
       select ''insert into %I.%I (%s) values ('' || %s || '');''
       from %I.%I',
      r.schema_name,
      r.table_name,
      col_list,
      val_expr,
      r.schema_name,
      r.table_name
    );

    execute data_sql;
  end loop;

  for r in
    select sequence_schema, sequence_name
    from information_schema.sequences
    where sequence_schema in ('public', 'auth')
    order by sequence_schema, sequence_name
  loop
    execute format(
      'insert into clone_dump_lines(line)
       select ''select setval('' || quote_literal(%L) || '', '' || last_value || '', '' || is_called || '');''
       from %I.%I',
      r.sequence_schema || '.' || r.sequence_name,
      r.sequence_schema,
      r.sequence_name
    );
  end loop;

  insert into clone_dump_lines(line) values
    ('set session_replication_role = origin;');
end $$;

select string_agg(line, E'\n' order by line_no) as dump_sql
from clone_dump_lines;
