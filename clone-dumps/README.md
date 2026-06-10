# SIAKAD Supabase Clone Notes

Source project checked through MCP `siakad`:

- Project ref: `qudjkcpudzngqzhkqccl`
- Env status: `DEV`
- Scope: public schema/data, selected auth data, storage bucket/object metadata

## Files

- `siakad_clone_restore_schema_from_local_migrations.sql`
  - Restore schema skeleton from local `migrations/*.sql`.
- `siakad_live_schema_patch.sql`
  - Adds live tables found through MCP but missing from local migrations: `edom_*`, `notification_devices`, `notification_queue`.
- `siakad_data_dump_generator.sql`
  - Run on the source project SQL editor/MCP to generate `INSERT` statements for public/auth/storage metadata.
- `../scripts/export-supabase-clone.mjs`
  - Direct DB exporter. It is kept for environments with working direct/pooler Postgres access.

## Restore Order

1. Run `siakad_clone_restore_schema_from_local_migrations.sql` on the fresh target project.
2. Run `siakad_live_schema_patch.sql` on the same target.
3. Run `siakad_data_dump_generator.sql` on the source project.
4. Copy the returned `dump_sql` result.
5. Run that returned SQL on the target project.
6. Copy physical storage files separately. SQL only restores `storage.buckets` and `storage.objects` metadata.

## Verified Source Snapshot

- Public tables: 57
- Auth users: 2
- Auth identities: 2
- Storage bucket/object metadata: `pmb-payment-proofs` with 1 object
- Data generator validation: 228 SQL lines, about 65 KB

## Local Limitation

`pg_dump`/Supabase CLI could not run here because Docker Desktop was not running, and direct Supabase DB host resolved only to IPv6 while this environment could not reach IPv6. MCP access worked, so the clone artifact uses MCP-verified live schema gaps plus a SQL data generator.
