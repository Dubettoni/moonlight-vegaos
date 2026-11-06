import {WebView} from '@amazon-devices/webview';
import * as React from 'react';
import {useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import {
  useHideSplashScreenCallback,
  usePreventHideSplashScreen,
} from '@amazon-devices/react-native-kepler';
import {
  SslErrorData,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewNavigationEvent,
  WebViewMessageEvent,
} from '@amazon-devices/webview/dist/types/WebViewTypes';

export const App = () => {
  const webRef = useRef(null);
  const onRemoteBridgeMessage = ({nativeEvent: {data}}: WebViewMessageEvent) => {
    if (data !== 'MOONLIGHT_VEGA_ANDROID_BACK_V1') return;
    // Native networking (not browser fetch) avoids HTTPS->LAN mixed-content blocking.
    fetch('http://192.168.0.100:18843/back', {method: 'POST'})
      .then(response => {
        if (!response.ok) {
          console.error('[Moonlight Vega] Android BACK bridge HTTP ' + response.status);
        } else {
          console.info('[Moonlight Vega] Android KEYCODE_BACK delivered');
        }
      })
      .catch(error => console.error('[Moonlight Vega] Android BACK bridge unavailable', error));
  };
  // By default splash screen is shown in app launch, as the splash
  // screen images are bundled in this app (assets/raw/ folder)
  // Declare that application wants to extend splash screen lifecycle
  usePreventHideSplashScreen();
  const hideSplashScreenCallback = useHideSplashScreenCallback();
  return (
    <View style={styles.container}>
      <WebView
        injectedJavaScriptBeforeContentLoaded={VEGA_MEDIA_KEY_BRIDGE}
        onMessage={onRemoteBridgeMessage}
        ref={webRef}
        style={styles.webview}
        allowSystemKeyEvents
        allowsDefaultMediaControl
        domStorageEnabled
        hasTVPreferredFocus
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        // thirdPartyCookiesEnabled
        // userAgent={''}
        source={{
          // headers: {},
          uri: "https://stream.moonlightweb.top/8cpbmtyn7pe57qqyxf7c2nd49g",
        }}
        onLoad={(_event: WebViewNavigationEvent) => {
          console.info('Page loading completed...');
          // Hide the splash screen
          hideSplashScreenCallback();
        }}
        onLoadStart={(_event: WebViewNavigationEvent) => {
          console.info('Page loading started...');
        }}
        onError={({
          nativeEvent: {code, url, description},
        }: WebViewErrorEvent) => {
          console.error(`[onError]: (${code}: ${url}) ${description}`);
        }}
        onHttpError={({
          nativeEvent: {url, statusCode: code, description, isMainFrame},
        }: WebViewHttpErrorEvent) => {
          console.error(`[onHttpError]: (${code}: ${url}) ${description}`);
          console.error(`[onHttpError]: isMainFrame: ${isMainFrame}`);
        }}
        onSslError={({code, url, description}: SslErrorData) => {
          console.error(`[onSslError]: (${code}: ${url}) ${description}`);
        }}
      />
    </View>
  );
};

// Styles for layout, which are necessary for proper focus behavior
const styles = StyleSheet.create({
  container: {flex: 1},
  webview: {backgroundColor: '#000000'},
});

// VEGA_MEDIA_BRIDGE_INSTALLED
// MoonlightWeb 0.4.1: use its StreamView methods, not untrusted synthetic
// KeyboardEvents. MediaRewind opens the built-in remote menu. GoBack sends
// VK_ESCAPE to the Windows host (Android emulator Back).
const VEGA_MEDIA_KEY_BRIDGE = String.raw`
(function () {
  if (window.__vegaMediaBridgeInstalled) return true;
  window.__vegaMediaBridgeInstalled = true;

  var appModulePromise = null;
  var held = Object.create(null);
  var statusPanel = null;
  var statusTimer = null;

  function notify(message, isError) {
    console.info('[Moonlight Vega remote]', message);
    if (!statusPanel) {
      statusPanel = document.createElement('div');
      statusPanel.style.cssText = 'position:fixed;right:12px;top:12px;z-index:2147483647;background:rgba(0,0,0,.80);color:#afffbc;padding:8px 12px;border-radius:7px;font:14px sans-serif;pointer-events:none';
      (document.body || document.documentElement).appendChild(statusPanel);
    }
    statusPanel.textContent = message;
    statusPanel.style.color = isError ? '#ffabab' : '#afffbc';
    statusPanel.style.display = 'block';
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () {
      if (statusPanel) statusPanel.style.display = 'none';
    }, isError ? 4500 : 1600);
  }

  function streamView() {
    if (!appModulePromise) {
      var entry = document.querySelector('script[type="module"][src*="/js/app.js"]');
      if (!entry) {
        return Promise.reject(new Error('Modulo MoonlightWeb nao encontrado'));
      }
      appModulePromise = import(entry.src).then(function (mod) {
        if (!mod.MoonlightApp) throw new Error('MoonlightApp indisponivel');
        return mod.MoonlightApp;
      }).catch(function (err) {
        appModulePromise = null;
        throw err;
      });
    }
    return appModulePromise.then(function (app) {
      if (!app.streamView || app.streamView._quitting)
        throw new Error('Streaming nao esta ativo');
      return app.streamView;
    });
  }

  function source(event) {
    var key = event.key || '', code = event.code || '';
    var n = Number(event.keyCode || event.which || 0);
    if (key === 'GoBack' || key === 'BrowserBack' ||
        code === 'GoBack' || code === 'BrowserBack' || n === 27)
      return 'back';
    if (key === 'MediaRewind' || code === 'MediaRewind' || n === 227)
      return 'menu';
    if (key === 'MediaPlayPause' || code === 'MediaPlayPause' || n === 179)
      return 'play';
    if (key === 'MediaFastForward' || code === 'MediaFastForward' || n === 228)
      return 'ff';
    return null;
  }

  function menu() {
    streamView().then(function (view) {
      view._openRemoteMenu();
      notify('Menu MoonlightWeb');
    }).catch(function (e) { notify('Menu: ' + e.message, true); });
  }

  function androidBack() {
    var bridge = window.ReactNativeWebView;
    if (!bridge || typeof bridge.postMessage !== 'function') {
      notify('Voltar: ponte nativa indisponivel', true);
      return;
    }
    bridge.postMessage('MOONLIGHT_VEGA_ANDROID_BACK_V1');
    notify('Android BACK solicitado');
  }

  // Keep existing Play/Pause and Fast Forward behavior intact.
  var binding = {
    play: {key:'MediaPlayPause', code:'MediaPlayPause', vk:179},
    ff:   {key:'ArrowRight', code:'ArrowRight', vk:39}
  };
  function emit(type, name, repeat) {
    var m = binding[name];
    var e = new KeyboardEvent(type, {
      key:m.key, code:m.code, bubbles:true, cancelable:true, repeat:!!repeat
    });
    try {
      Object.defineProperty(e, 'keyCode', {get:function(){return m.vk;}});
      Object.defineProperty(e, 'which', {get:function(){return m.vk;}});
    } catch (_) {}
    var target = document.activeElement;
    if (!target || !target.isConnected) target = document.body || document;
    target.dispatchEvent(e);
  }

  function onPhysical(event) {
    if (!event.isTrusted) return;
    var name = source(event);
    if (!name) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if (name === 'back' || name === 'menu') {
      if (event.type === 'keydown' && !held[name]) {
        held[name] = true;
        if (name === 'back') androidBack(); else menu();
      }
      if (event.type === 'keyup') held[name] = false;
      return;
    }
    if (event.type === 'keyup') {
      if (held[name]) emit('keyup', name, false);
      held[name] = false;
      return;
    }
    if (!held[name]) {
      held[name] = true;
      emit('keydown', name, false);
    } else if (name === 'ff') {
      emit('keydown', name, true);
    }
  }

  window.addEventListener('keydown', onPhysical, true);
  window.addEventListener('keyup', onPhysical, true);
  return true;
})();
true;
`;
