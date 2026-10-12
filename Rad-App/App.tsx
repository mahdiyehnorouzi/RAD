import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RadWebView } from './src/RadWebView';
import { SplashOverlay } from './src/SplashOverlay';
import { SPLASH_MAX_MS, SPLASH_MIN_MS, colors } from './src/config';

function App() {
  const [splashHidden, setSplashHidden] = useState(false);
  const startedAt = useRef(Date.now());

  const hideSplash = useCallback(() => {
    const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - startedAt.current));
    setTimeout(() => setSplashHidden(true), wait);
  }, []);

  // Never trap the user on the splash if the page never reports load end.
  useEffect(() => {
    const timer = setTimeout(() => setSplashHidden(true), SPLASH_MAX_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        style={styles.root}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <RadWebView onFirstLoad={hideSplash} />
      </SafeAreaView>
      <SplashOverlay hidden={splashHidden} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});

export default App;
