#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$ROOT/MoonlightVega"
APP="$PROJECT/src/App.tsx"
BACKUP="$PROJECT/src/App.tsx.antes-teste-controle.bak"
if [[ ! -f "$APP" || ! -d "$PROJECT/assets" ]]; then
  echo "Projeto MoonlightVega/src/App.tsx ou assets/ nao encontrado."
  exit 1
fi
if [[ -f "$BACKUP" ]]; then
  echo "Backup existente: $BACKUP. Restaure antes de repetir este teste."
  exit 1
fi
cp "$APP" "$BACKUP"
cp "$ROOT/tests/controle-remoto.html" "$PROJECT/assets/controle-remoto.html"
export APP
python3 - <<'PY'
import os, re, pathlib, sys
path=pathlib.Path(os.environ['APP'])
text=path.read_text(encoding='utf-8')
pattern=r'^(?!\s*//)(\s*uri\s*:\s*)(["\x27])([^"\x27]+)\2'
matches=list(re.finditer(pattern,text,re.M))
if len(matches)!=1:
    print('Nao localizei uma unica linha URI ativa. Nenhuma alteracao feita.')
    sys.exit(1)
m=matches[0]
text=text[:m.start()]+m.group(1)+m.group(2)+'file:///pkg/assets/controle-remoto.html'+m.group(2)+text[m.end():]
if '<WebView' not in text:
    print('WebView nao encontrado. Nenhuma alteracao feita.')
    sys.exit(1)
if re.search(r'allowSystemKeyEvents\s*=\s*\{false\}',text):
    text=re.sub(r'allowSystemKeyEvents\s*=\s*\{false\}', 'allowSystemKeyEvents={true}', text, count=1)
elif 'allowSystemKeyEvents' not in text:
    text=text.replace('<WebView','<WebView\n          allowSystemKeyEvents={true}',1)
if 'hasTVPreferredFocus' not in text:
    text=text.replace('<WebView','<WebView\n          hasTVPreferredFocus={true}',1)
path.write_text(text,encoding='utf-8')
print('Tela de teste ativada. Backup original preservado.')
PY

if [[ -f "$HOME/vega/env" ]]; then
  source "$HOME/vega/env"
fi
cd "$PROJECT"
npx react-native build-vega
vega device install-app --packagePath build/armv7-release/moonlightvega_armv7.vpkg
vega device launch-app --appName com.dubettoni.moonlightvega.main
echo "Pressione os botoes do controle na TV. Quando terminar: bash ../scripts/restaurar-controle.sh"
