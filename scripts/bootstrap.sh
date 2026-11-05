#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "$HOME/vega/env" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/vega/env"
fi

command -v vega >/dev/null || {
  echo "Vega CLI nao encontrado. Carregue ~/vega/env primeiro."
  exit 1
}

if [[ ! -f app/manifest.toml ]]; then
  if [[ -d app ]]; then
    echo "A pasta app existe sem manifest.toml; verifique manualmente."
    exit 1
  fi
  vega project generate \
    --template vegaWebview \
    --name moonlightvega \
    --packageId com.dubettoni.moonlightvega \
    --outputDir app
fi

mkdir -p app/src
cp starter/App.tsx app/src/App.tsx


cat <<'MSG'

Base gerada em ./app.
1. Edite app/src/App.tsx: STREAM_URL deve ser o endereco HTTPS do seu MoonlightWeb.
2. cd app && vega project install --fix && npm install
3. vega project doctor && npx react-native build-vega

A compilacao gera um .vpkg; o Fire TV real precisa ser testado na rede local
com modo de desenvolvedor/VDA. O Codespaces sozinho nao acessa o Fire TV.
MSG
