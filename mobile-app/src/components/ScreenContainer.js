import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

/**
 * Fixes two related problems the app had:
 *
 * 1. Content was not wrapped in a SafeAreaView, so on some Android devices
 *    (particularly ones with edge-to-edge display enabled by default) the
 *    screen's content could render underneath the status bar instead of
 *    below it.
 * 2. The status bar icon color was hard-coded to "light" (white) for the
 *    whole app in App.js. That's fine on the navy login screen, but white
 *    icons on the light/paper background used by every other screen are
 *    nearly invisible - which is exactly the "can't see the time/battery"
 *    symptom being reported.
 *
 * ScreenContainer wraps every screen in a SafeAreaView (so content always
 * starts below the notch/status bar and above the home indicator) and
 * picks a status bar icon color that actually contrasts with that
 * specific screen's background, overriding the app-wide default.
 */
export default function ScreenContainer({ children, style, statusBarStyle, edges = ['top', 'bottom'] }) {
  const { colors } = useTheme();

  // Default: dark icons on our light/paper backgrounds, light icons on
  // dark-mode or explicitly dark (e.g. navy) backgrounds. Screens can still
  // override this via the statusBarStyle prop (the login screen does, since
  // its background is always navy regardless of light/dark mode).
  const resolvedStatusBarStyle = statusBarStyle || (colors.mode === 'dark' ? 'light' : 'dark');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]} edges={edges}>
      <StatusBar style={resolvedStatusBarStyle} />
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
