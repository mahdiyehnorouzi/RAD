import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/ErrorBoundary';
import { RadWebView } from './src/RadWebView';
import { SplashOverlay } from './src/SplashOverlay';
import { SPLASH_MAX_MS, SPLASH_MIN_MS, colors } from './src/config';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {/* The splash lives inside the boundary, so a crash during startup shows the error screen right away. */}
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

function AppContent() {
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
    <>
      <SafeAreaView
        style={styles.root}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <RadWebView onFirstLoad={hideSplash} />
      </SafeAreaView>
      <SplashOverlay hidden={splashHidden} />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});

export default App;
