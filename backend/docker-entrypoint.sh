#!/bin/sh
# Waits for MySQL to accept connections, then runs migrations (and, only on
# an explicitly empty database, the seeders) before handing off to the
# actual server process. Keeps "docker compose up" a true one-command start.
set -e

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
until node -e "
  const net = require('net');
  const socket = net.connect({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT) });
  socket.on('connect', () => { socket.end(); process.exit(0); });
  socket.on('error', () => process.exit(1));
"; do
  sleep 2
done
echo "MySQL is up — running migrations."

npx sequelize-cli db:migrate

if [ "$RUN_SEED_ON_BOOT" = "true" ]; then
  echo "Seeding database..."
  npx sequelize-cli db:seed:all || true
fi

echo "Starting server."
exec node src/server.js
