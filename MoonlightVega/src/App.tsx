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
} from '@amazon-devices/webview/dist/types/WebViewTypes';

export const App = () => {
  const webRef = useRef(null);
  // By default splash screen is shown in app launch, as the splash
  // screen images are bundled in this app (assets/raw/ folder)
  // Declare that application wants to extend splash screen lifecycle
  usePreventHideSplashScreen();
  const hideSplashScreenCallback = useHideSplashScreenCallback();
  return (
    <View style={styles.container}>
      <WebView
        injectedJavaScriptBeforeContentLoaded={VEGA_MEDIA_KEY_BRIDGE}
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
const VEGA_MEDIA_KEY_BRIDGE = String.raw`
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
`;
