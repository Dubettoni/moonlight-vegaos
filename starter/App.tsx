import React, {useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {WebView} from '@amazon-devices/webview';

// Altere para o endereco HTTPS que ja funciona no navegador da sua rede.
// Nao inclua credenciais ou tokens permanentes nesta URL.
const STREAM_URL = 'https://SUBSTITUA-PELO-ENDERECO-DO-SEU-PC';

const CAPABILITY_PROBE = `
(function () {
  try {
    var video = document.createElement('video');
    var report = {
      type: 'moonlight-capabilities',
      secureContext: window.isSecureContext,
      webRTC: typeof RTCPeerConnection !== 'undefined',
      webCodecs: typeof VideoDecoder !== 'undefined',
      webGL2: !!document.createElement('canvas').getContext('webgl2'),
      h264HtmlVideo: video.canPlayType('video/mp4; codecs="avc1.42E01E"'),
      origin: window.location.origin
    };
    window.ReactNativeWebView &&
      window.ReactNativeWebView.postMessage(JSON.stringify(report));
  } catch (err) {
    window.ReactNativeWebView &&
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'moonlight-probe-error',
        message: String(err)
      }));
  }
})();
true;
`;

export const App = () => {
  const webRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.root}>
      <WebView
        ref={webRef}
        style={styles.web}
        source={{uri: STREAM_URL}}
        hasTVPreferredFocus={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowSystemKeyEvents={true}
        mediaPlaybackRequiresUserAction={false}
        onLoad={() => {
          setError(null);
          webRef.current?.injectJavaScript(CAPABILITY_PROBE);
        }}
        onMessage={(event: any) => {
          console.log('[Moonlight Vega]', event.nativeEvent.data);
        }}
        onError={(event: any) => {
          setError(event.nativeEvent.description || 'Falha de conexao');
        }}
        onHttpError={(event: any) => {
          if (event.nativeEvent.isMainFrame) {
            setError('HTTP ' + event.nativeEvent.statusCode);
          }
        }}
      />
      {error ? (
        <View style={styles.error}>
          <Text style={styles.heading}>Moonlight Vega OS</Text>
          <Text style={styles.message}>
            Nao foi possivel abrir o MoonlightWeb: {error}
          </Text>
          <Text style={styles.hint}>
            Confira o endereco HTTPS, a rede e o certificado do servidor.
          </Text>
          <Pressable
            focusable={true}
            onPress={() => {
              setError(null);
              webRef.current?.reload();
            }}
            style={styles.retry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  web: {flex: 1, backgroundColor: '#000'},
  error: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#10151f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  heading: {fontSize: 32, color: '#fff', fontWeight: 'bold'},
  message: {fontSize: 20, color: '#fff', marginTop: 22, textAlign: 'center'},
  hint: {fontSize: 16, color: '#aab9ca', marginTop: 12, textAlign: 'center'},
  retry: {backgroundColor: '#2563eb', padding: 18, borderRadius: 12, marginTop: 26},
  retryText: {color: '#fff', fontSize: 20, fontWeight: 'bold'},
});

export default App;
