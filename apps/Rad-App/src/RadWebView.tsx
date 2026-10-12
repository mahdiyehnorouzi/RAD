import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Linking,
  Platform,
  Share,
  StyleSheet,
  ToastAndroid,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewHttpErrorEvent,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';
import { ErrorScreen } from './ErrorScreen';
import {
  BACK_EXIT_WINDOW_MS,
  CRASH_LOOP_WINDOW_MS,
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

/** offline: network failure; server: 5xx on the page itself; crash: WebView process keeps dying. */
type LoadError = 'offline' | 'server' | 'crash';

function isInternal(url: string): boolean {
  const match = /^https?:\/\/([^/:?#]+)/i.exec(url);
  if (!match) return false;
  const host = match[1].toLowerCase();
  return INTERNAL_HOSTS.some(h => host === h || host.endsWith(`.${h}`));
}

/**
 * Android's WebView has no Web Share API, so `navigator.share` (used by the
 * favorites page) is bridged to the native share sheet. Only added when missing.
 */
const SHARE_BRIDGE = `(function () {
  if (navigator.share || !window.ReactNativeWebView) return;
  navigator.share = function (data) {
    data = data || {};
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'rad:share',
      title: String(data.title || ''),
      text: String(data.text || ''),
      url: String(data.url || '')
    }));
    return Promise.resolve();
  };
})();
true;`;

export function RadWebView({ onFirstLoad }: Props) {
  const webView = useRef<RadWebViewRef>(null);
  const canGoBack = useRef(false);
  const firstLoadDone = useRef(false);
  const lastCrashAt = useRef(0);
  const lastBackAt = useRef(0);
  const [error, setError] = useState<LoadError | null>(null);
  // Changing the key remounts the WebView on the home page.
  const [sessionKey, setSessionKey] = useState(0);

  const finishFirstLoad = useCallback(() => {
    if (firstLoadDone.current) return;
    firstLoadDone.current = true;
    onFirstLoad();
  }, [onFirstLoad]);

  // Android back walks the WebView history, then asks for a second press before exiting.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack.current && !error) {
        webView.current?.goBack();
        return true;
      }
      const now = Date.now();
      if (now - lastBackAt.current < BACK_EXIT_WINDOW_MS) return false;
      lastBackAt.current = now;
      ToastAndroid.show(copy.pressBackAgain, ToastAndroid.SHORT);
      return true;
    });
    return () => sub.remove();
  }, [error]);

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

  // Both platforms only report HTTP errors for the main document, not images or API calls.
  // 4xx is left to the site, which renders its own not-found page.
  const onHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      if (event.nativeEvent.statusCode >= 500) setError('server');
      finishFirstLoad();
    },
    [finishFirstLoad],
  );

  // A single WebView process crash recovers quietly; a second one soon after shows the error screen.
  // iOS can reload the same view; on Android the dead view must be replaced (remounted).
  const onProcessCrash = useCallback(() => {
    const now = Date.now();
    if (now - lastCrashAt.current < CRASH_LOOP_WINDOW_MS) {
      setError('crash');
    } else if (Platform.OS === 'ios') {
      webView.current?.reload();
    } else {
      setSessionKey(k => k + 1);
    }
    lastCrashAt.current = now;
  }, []);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    if (!isInternal(event.nativeEvent.url)) return;
    let data: unknown;
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (
      typeof data === 'object' &&
      data !== null &&
      (data as { type?: unknown }).type === 'rad:share'
    ) {
      const { title, text, url } = data as Record<string, string>;
      const message = [text, url].filter(Boolean).join('\n');
      if (message) Share.share({ title, message, url }).catch(() => {});
    }
  }, []);

  const reload = useCallback(() => {
    setError(null);
    webView.current?.reload();
  }, []);

  const goHome = useCallback(() => {
    setError(null);
    canGoBack.current = false;
    setSessionKey(k => k + 1);
  }, []);

  return (
    <View style={styles.container}>
      <WebView<object>
        key={sessionKey}
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
        injectedJavaScriptBeforeContentLoaded={SHARE_BRIDGE}
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
        onMessage={onMessage}
        onLoadEnd={finishFirstLoad}
        onError={() => {
          setError('offline');
          finishFirstLoad();
        }}
        onHttpError={onHttpError}
        onContentProcessDidTerminate={onProcessCrash}
        onRenderProcessGone={() => {
          onProcessCrash();
          return true;
        }}
      />
      {error === 'offline' && (
        <ErrorScreen
          title={copy.offlineTitle}
          body={copy.offlineBody}
          primary={{ label: copy.retry, onPress: reload }}
        />
      )}
      {error === 'server' && (
        <ErrorScreen
          title={copy.errorTitle}
          body={copy.serverBody}
          primary={{ label: copy.reload, onPress: reload }}
          secondary={{ label: copy.home, onPress: goHome }}
        />
      )}
      {error === 'crash' && (
        <ErrorScreen
          title={copy.errorTitle}
          body={copy.crashBody}
          primary={{ label: copy.reload, onPress: goHome }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  webView: { flex: 1, backgroundColor: colors.canvas },
});
