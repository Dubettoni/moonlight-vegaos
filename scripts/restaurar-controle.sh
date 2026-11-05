#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$ROOT/MoonlightVega"
APP="$PROJECT/src/App.tsx"
BACKUP="$PROJECT/src/App.tsx.antes-teste-controle.bak"
[[ -f "$BACKUP" ]] || { echo "Backup nao encontrado: $BACKUP"; exit 1; }
cp "$BACKUP" "$APP"
rm "$BACKUP"
if [[ -f "$HOME/vega/env" ]]; then source "$HOME/vega/env"; fi
cd "$PROJECT"
npx react-native build-vega
vega device install-app --packagePath build/armv7-release/moonlightvega_armv7.vpkg
vega device launch-app --appName com.dubettoni.moonlightvega.main
echo "MoonlightWeb restaurado e reinstalado."
