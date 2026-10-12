import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';
import {
  INTERNAL_HOSTS,
  SITE_URL,
  USER_AGENT_SUFFIX,
  colors,
  copy,
} from './config';

// react-native-webview's index.d.ts defaults the extra-props generic to `undefined`,
// and `WebViewProps & undefined` collapses to `never` under TypeScript 6.
// Passing `object` explicitly keeps the real props type.
type RadWebViewRef = WebView<object>;

type Props = {
  /** Called once, when the first page has finished loading (or failed). */
  onFirstLoad: () => void;
};

function isInternal(url: string): boolean {
  const match = /^https?:\/\/([^/:?#]+)/i.exec(url);
  if (!match) return false;
  const host = match[1].toLowerCase();
  return INTERNAL_HOSTS.some(h => host === h || host.endsWith(`.${h}`));
}

export function RadWebView({ onFirstLoad }: Props) {
  const webView = useRef<RadWebViewRef>(null);
  const canGoBack = useRef(false);
  const firstLoadDone = useRef(false);
  const [failed, setFailed] = useState(false);

  const finishFirstLoad = useCallback(() => {
    if (firstLoadDone.current) return;
    firstLoadDone.current = true;
    onFirstLoad();
  }, [onFirstLoad]);

  // Android hardware back walks the WebView history before leaving the app.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack.current && !failed) {
        webView.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [failed]);

  const onNavigationStateChange = useCallback((nav: WebViewNavigation) => {
    canGoBack.current = nav.canGoBack;
  }, []);

  // Keep the storefront in-app; hand everything else (tel:, mailto:, social links) to the OS.
  const onShouldStartLoadWithRequest = useCallback(
    (req: ShouldStartLoadRequest) => {
      const { url } = req;
      if (
        url.startsWith('about:') ||
        url.startsWith('blob:') ||
        url.startsWith('data:')
      ) {
        return true;
      }
      // Sub-frames (embeds, maps) load normally; only top-level navigation is routed.
      if (Platform.OS === 'ios' && req.isTopFrame === false) return true;
      if (isInternal(url)) return true;
      Linking.openURL(url).catch(() => {});
      return false;
    },
    [],
  );

  const retry = useCallback(() => {
    setFailed(false);
    webView.current?.reload();
  }, []);

  return (
    <View style={styles.container}>
      <WebView<object>
        ref={webView}
        source={{ uri: SITE_URL }}
        style={styles.webView}
        containerStyle={styles.webView}
        originWhitelist={[
          'https://*',
          'http://*',
          'tel:*',
          'mailto:*',
          'intent:*',
        ]}
        applicationNameForUserAgent={USER_AGENT_SUFFIX}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        allowFileAccess={false}
        mixedContentMode="never"
        overScrollMode="never"
        decelerationRate="normal"
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onLoadEnd={finishFirstLoad}
        onError={() => {
          setFailed(true);
          finishFirstLoad();
        }}
        onHttpError={finishFirstLoad}
        onContentProcessDidTerminate={() => webView.current?.reload()}
        onRenderProcessGone={() => {
          webView.current?.reload();
          return true;
        }}
      />
      {failed && (
        <View style={styles.error}>
          <Text style={styles.errorTitle}>{copy.offlineTitle}</Text>
          <Text style={styles.errorBody}>{copy.offlineBody}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={retry}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>{copy.retry}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  webView: { flex: 1, backgroundColor: colors.canvas },
  error: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  errorBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  button: {
    marginTop: 24,
    backgroundColor: colors.moss,
    borderRadius: 4,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
