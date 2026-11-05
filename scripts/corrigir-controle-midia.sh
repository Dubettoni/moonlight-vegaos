#!/usr/bin/env bash
# Moonlight Vega - mapeamento reversivel dos botoes especiais.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/MoonlightVega/src/App.tsx"
BACKUP="$ROOT/MoonlightVega/src/App.tsx.antes-midia.bak"

if [[ "$#" -gt 0 && "$1" == "--restaurar" ]]; then
  [[ -f "$BACKUP" ]] || { echo "Backup nao encontrado: $BACKUP"; exit 1; }
  cp "$BACKUP" "$APP"
  echo "Restaurado: $APP"
  exit 0
fi

[[ -f "$APP" ]] || { echo "App.tsx nao encontrado: $APP"; exit 1; }
export APP BACKUP
python3 - <<'PY'
import os
from pathlib import Path

app = Path(os.environ['APP'])
backup = Path(os.environ['BACKUP'])
text = app.read_text(encoding='utf-8')
marker = 'VEGA_MEDIA_BRIDGE_INSTALLED'

if marker in text:
    print('Mapeamento ja instalado.')
    raise SystemExit(0)
if backup.exists():
    raise SystemExit('Backup anterior presente; restaure ou revise antes de reaplicar.')
if text.count('<WebView') != 1:
    raise SystemExit('Esperava um unico WebView; nenhuma alteracao realizada.')
if 'injectedJavaScriptBeforeContentLoaded=' in text:
    raise SystemExit('Ja existe injecao de script; revise manualmente antes de modificar.')

bridge = r"""
(function () {
  if (window.__vegaMediaBridgeInstalled) return true;
  window.__vegaMediaBridgeInstalled = true;

  var binding = {
    back:   {key:'ColorF0Red',code:'ColorF0Red',vk:0},
    play:   {key:'MediaPlayPause',code:'MediaPlayPause',vk:179},
    rewind: {key:'ArrowLeft',code:'ArrowLeft',vk:37},
    ff:     {key:'ArrowRight',code:'ArrowRight',vk:39}
  };
  var held = Object.create(null);

  function source(e) {
    var key = e.key || '', code = e.code || '';
    var n = Number(e.keyCode || e.which || 0);
    if (key === 'GoBack' || key === 'BrowserBack' ||
        code === 'GoBack' || code === 'BrowserBack' || n === 27) return 'back';
    if (key === 'MediaPlayPause' || code === 'MediaPlayPause' || n === 179) return 'play';
    if (key === 'MediaRewind' || code === 'MediaRewind' || n === 227) return 'rewind';
    if (key === 'MediaFastForward' || code === 'MediaFastForward' || n === 228) return 'ff';
    return null;
  }

  function emit(type, name, repeated) {
    var m = binding[name];
    var e = new KeyboardEvent(type, {
      key:m.key, code:m.code, bubbles:true, cancelable:true,
      repeat:!!repeated
    });
    try {
      Object.defineProperty(e, 'keyCode', {get:function(){return m.vk;}});
      Object.defineProperty(e, 'which', {get:function(){return m.vk;}});
    } catch (error) {
      console.warn('[Moonlight Vega] keyCode:', error);
    }
    var target = document.activeElement;
    if (!target || !target.isConnected) target = document.body || document;
    target.dispatchEvent(e);
  }

  function release(name) {
    var old = held[name];
    if (!old) return;
    clearTimeout(old.timer);
    delete held[name];
    emit('keyup', name, false);
  }

  function onPhysical(event) {
    if (!event.isTrusted) return;
    var name = source(event);
    if (!name) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if (event.type === 'keyup') {
      release(name);
      return;
    }
    if (!held[name]) {
      held[name] = {timer:null};
      emit('keydown', name, false);
    } else if (name === 'rewind' || name === 'ff') {
      emit('keydown', name, true);
    }
    clearTimeout(held[name].timer);
    held[name].timer = setTimeout(function(){release(name);}, 1800);
  }

  window.addEventListener('keydown', onPhysical, true);
  window.addEventListener('keyup', onPhysical, true);
  return true;
})();
true;
"""
tick = chr(96)
constant = '\n\n// ' + marker + '\nconst VEGA_MEDIA_KEY_BRIDGE = String.raw' + tick + '\n' + bridge.strip() + '\n' + tick + ';\n'
patch = text.rstrip() + constant
extra = '\n        injectedJavaScriptBeforeContentLoaded={VEGA_MEDIA_KEY_BRIDGE}'
if 'allowsDefaultMediaControl' not in text:
    extra += '\n        allowsDefaultMediaControl={false}'
patch = patch.replace('<WebView', '<WebView' + extra, 1)

backup.write_text(text, encoding='utf-8')
try:
    app.write_text(patch, encoding='utf-8')
except Exception:
    app.write_text(text, encoding='utf-8')
    raise

print('Corrigido:', app)
print('Backup:', backup)
print('Back -> menu MoonlightWeb; Play/Pause -> tecla de midia; Rewind/FF -> esquerda/direita.')
PY
