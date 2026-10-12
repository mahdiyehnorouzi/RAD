import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text } from 'react-native';
import { colors, copy } from './config';

type Props = {
  /** When true the overlay fades out and unmounts. */
  hidden: boolean;
};

/**
 * Continues the native launch screen (same canvas color and centered mark)
 * while the storefront loads, then fades away.
 */
export function SplashOverlay({ hidden }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const subtitle = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    Animated.timing(subtitle, {
      toValue: 1,
      duration: 500,
      delay: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [subtitle]);

  useEffect(() => {
    if (!hidden) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => finished && setMounted(false));
  }, [hidden, opacity]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity }]}
      pointerEvents={hidden ? 'none' : 'auto'}
    >
      <Image
        source={require('./assets/rad-mark.png')}
        style={styles.mark}
        accessibilityIgnoresInvertColors
      />
      <Animated.View
        style={[
          styles.subtitleWrap,
          {
            opacity: subtitle,
            transform: [
              {
                translateY: subtitle.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Same size and position as the native launch screen mark, so the hand-off is seamless.
  mark: {
    width: 120,
    height: 120,
  },
  // Absolutely placed so the mark stays exactly centered.
  subtitleWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: 60 + 20,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    letterSpacing: 0.5,
    writingDirection: 'rtl',
  },
});
