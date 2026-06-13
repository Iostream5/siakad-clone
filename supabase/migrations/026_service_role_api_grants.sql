-- 026_service_role_api_grants.sql
-- Ensure the server-side Supabase service role can access public schema objects via PostgREST.

grant usage on schema public to service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges for role postgres in schema public
grant all privileges on tables to service_role;

alter default privileges for role postgres in schema public
grant all privileges on sequences to service_role;

alter default privileges for role postgres in schema public
grant execute on functions to service_role;
