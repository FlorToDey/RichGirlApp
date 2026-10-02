#!/usr/bin/env bash
# Deploy from your machine: ./scripts/deploy.sh root@194.87.148.14
# Asks for the server password (or uses SSH keys). With sshpass installed you can
# pass it via env: SSHPASS=... ./scripts/deploy.sh root@host
set -euo pipefail
TARGET=${1:-root@194.87.148.14}
APP_DIR=/opt/golddigg
cd "$(dirname "$0")/.."

SSH="ssh -o StrictHostKeyChecking=accept-new"
if [ -n "${SSHPASS:-}" ] && command -v sshpass >/dev/null; then SSH="sshpass -e $SSH"; fi

echo "==> uploading to $TARGET:$APP_DIR"
tar czf - --exclude=node_modules --exclude=dist --exclude=.git --exclude='web/android' --exclude='server/data' --exclude='*.apk' . \
  | $SSH "$TARGET" "mkdir -p $APP_DIR && tar xzf - -C $APP_DIR"
$SSH "$TARGET" "APP_DIR=$APP_DIR bash $APP_DIR/scripts/server-install.sh"
