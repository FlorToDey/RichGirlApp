#!/usr/bin/env bash
# Runs on the server: installs Docker if needed and (re)starts GoldDigg.
set -euo pipefail
APP_DIR=${APP_DIR:-/home/lymoos/golddigg}
cd "$APP_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "==> installing docker"
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  apt-get update && apt-get install -y docker-compose-plugin
fi
systemctl enable --now docker >/dev/null 2>&1 || true

echo "==> building and starting"
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null

for i in $(seq 1 30); do
  if curl -fs http://127.0.0.1/api/health >/dev/null; then
    echo "==> GoldDigg is up: http://$(hostname -I | awk '{print $1}')/"
    exit 0
  fi
  sleep 2
done
echo "!! health check failed"; docker compose logs --tail 50; exit 1
