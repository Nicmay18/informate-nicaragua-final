#!/bin/bash
# DEPLOY PUSH — Nicaragua Informate
# Uso: bash scripts/deploy/push-changes.sh "Mensaje de commit"

set -euo pipefail
IFS=$'\n\t'

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${REPO_ROOT}" || exit 1

PUSH_MESSAGE="${1:-deploy: cambios automáticos}"

if ! git diff-index --quiet HEAD --; then
  git add -A
  git commit -m "${PUSH_MESSAGE}"
  git pull --rebase origin master
  git push origin master
else
  echo "No hay cambios para commitear" >&2
  exit 0
fi
