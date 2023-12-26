set -e

if [ "$#" -ne 1 ]; then
  echo "Invalid args"
  exit 1
fi

DB_FILE=${1}

# Migrate schema
(cd packages/database && npx prisma migrate deploy)

# If DB_FILE is not empty and the file exists, then migrate
if [ -n "$DB_FILE" ] && [ -e "$DB_FILE" ]
then
  # Old SQLite DB file found! Migrate data over to Postgres DB.
  echo "Migrating data from SQLite to Postgres..."
  PGLD_SQLITE_FILE="sqlite://${DB_FILE}" PGLD_POSTGRES_URL="${DATABASE_URL}" pgloader apps/web/tools/migrate-to-postgres-db.load

  # Rename SQLite DB file so next time this migration does not run again!
  mv "${DB_FILE}" "${DB_FILE}.old"
else
  # Seed database
  echo "Seeding database ..."
  node apps/web/tools/db-seed.mjs
fi
