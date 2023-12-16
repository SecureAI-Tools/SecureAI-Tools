#!/usr/bin/env sh

set -eu

available() { command -v $1 >/dev/null; }
require() {
  local MISSING_TOOLS=''
  for TOOL in $*; do
    if ! available $TOOL; then
      MISSING_TOOLS="$MISSING_TOOLS $TOOL"
    fi
  done

  echo $MISSING_TOOLS
}

NEEDS=$(require curl openssl sed)
if [ -n "$NEEDS" ]; then
  echo "ERROR: Following tools are required but missing:"
  for NEED in $NEEDS; do
    echo "  - $NEED"
  done
  exit 1
fi

echo "Setting up instance"

# Download docker-compose.yml file
echo "  Downloading docker-compose.yml"
curl -OsL https://github.com/SecureAI-Tools/SecureAI-Tools/releases/latest/download/docker-compose.yml

# Download .env file
echo "  Generating .env file with sensible defaults"
curl -sL -o .env https://github.com/SecureAI-Tools/SecureAI-Tools/releases/latest/download/example.env

# Set POSTGRES_PASSWORD
POSTGRES_PASSWORD=$(openssl rand -hex 32)
sed -i.bak -e "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=\"${POSTGRES_PASSWORD}\"/g" -- .env && rm .env.bak

# Set RABBITMQ_DEFAULT_PASS
RABBITMQ_DEFAULT_PASS=$(openssl rand -hex 32)
sed -i.bak -e "s/RABBITMQ_DEFAULT_PASS=.*/RABBITMQ_DEFAULT_PASS=\"${RABBITMQ_DEFAULT_PASS}\"/g" -- .env && rm .env.bak

# Set NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -hex 32)
sed -i.bak -e "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=\"${NEXTAUTH_SECRET}\"/g" -- .env && rm .env.bak

# Set INSTANCE_CONFIG_INSTANCE_ID
INSTANCE_CONFIG_INSTANCE_ID=$(openssl rand -hex 32)
sed -i.bak -e "s/INSTANCE_CONFIG_INSTANCE_ID=.*/INSTANCE_CONFIG_INSTANCE_ID=\"${INSTANCE_CONFIG_INSTANCE_ID}\"/g" -- .env && rm .env.bak

echo "Instance has been configured 🎉"
echo "  Run \"docker compose up -d\" to start the instance"
