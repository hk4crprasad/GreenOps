#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -v db_name="$POSTGRES_DB" -v runtime_pass="$RUNTIME_DB_PASSWORD" -v migrator_pass="$MIGRATOR_DB_PASSWORD" <<'SQL'
BEGIN;
SELECT 'CREATE ROLE greenops' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname='greenops') \gexec
SELECT 'CREATE ROLE greenops_migrator' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname='greenops_migrator') \gexec
ALTER ROLE greenops LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD :'runtime_pass';
ALTER ROLE greenops_migrator LOGIN NOSUPERUSER BYPASSRLS PASSWORD :'migrator_pass';
GRANT CONNECT ON DATABASE :"db_name" TO greenops, greenops_migrator;
GRANT CREATE ON SCHEMA public TO greenops_migrator;
COMMIT;
SQL
