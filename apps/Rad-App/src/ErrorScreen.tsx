import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './config';

type Action = { label: string; onPress: () => void };

type Props = {
  title: string;
  body: string;
  primary: Action;
  secondary?: Action;
};

/** Full-screen Persian error state on the canvas background, shared by every failure path. */
export function ErrorScreen({ title, body, primary, secondary }: Props) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Image
        source={require('./assets/rad-mark.png')}
        style={styles.mark}
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={primary.onPress}
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
      >
        <Text style={styles.primaryText}>{primary.label}</Text>
      </Pressable>
      {secondary && (
        <Pressable
          accessibilityRole="button"
          onPress={secondary.onPress}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>{secondary.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  mark: { width: 56, height: 56, marginBottom: 24, opacity: 0.9 },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  primary: {
    marginTop: 24,
    minWidth: 200,
    alignItems: 'center',
    backgroundColor: colors.moss,
    borderRadius: 4,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  secondary: {
    marginTop: 12,
    minWidth: 200,
    alignItems: 'center',
    borderColor: colors.moss,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 28,
    paddingVertical: 11,
  },
  secondaryText: { color: colors.moss, fontSize: 15, fontWeight: '500' },
  pressed: { opacity: 0.85 },
});
