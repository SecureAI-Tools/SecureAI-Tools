set -e

if [ "$#" -ne 1 ]; then
  echo "Invalid args"
  exit 1
fi

DB_FILE=${1}

SEED_DB=true
if [ -e ${DB_FILE} ]
then
  SEED_DB=false
fi

# Run migration
DATABASE_URL="file:${DB_FILE}" npx prisma migrate deploy

# Seed database if needed
if [ "$SEED_DB" = true ] ; then
  echo "Seeding database ..."
  DATABASE_URL="file:${DB_FILE}" node tools/db-seed.mjs
else
  echo "DB already exists. No need to seed it again."
fi
