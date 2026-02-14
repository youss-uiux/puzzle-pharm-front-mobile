/**
 * Pill Tab Bar Component
 * Floating glassmorphism navigation for Modern Apothecary
 */
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, shadows, spacing } from '../../constants/theme';

interface PillTabBarBackgroundProps {
  children?: React.ReactNode;
}

export const PillTabBarBackground: React.FC<PillTabBarBackgroundProps> = () => {
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BlurView intensity={80} tint="light" style={styles.blur}>
          <View style={styles.overlay} />
        </BlurView>
      </View>
    );
  }

  // Android fallback with semi-transparent background
  return (
    <View style={[styles.container, styles.androidBackground]} />
  );
};

// Tab bar style configuration for expo-router Tabs
export const pillTabBarStyle = {
  position: 'absolute' as const,
  bottom: Platform.OS === 'ios' ? 24 : 16,
  left: 20,
  right: 20,
  height: 72,
  borderRadius: radius.pill,
  backgroundColor: 'transparent',
  borderTopWidth: 0,
  paddingBottom: 0,
  paddingTop: 0,
  ...shadows.lg,
};

export const pillTabBarItemStyle = {
  height: 72,
  paddingTop: 12,
  paddingBottom: 12,
};

export const pillTabBarLabelStyle = {
  fontSize: 11,
  fontWeight: '600' as const,
  letterSpacing: 0.3,
  marginTop: 4,
};

export const pillTabBarIconStyle = {
  marginBottom: 2,
};

// Colors
export const pillTabBarColors = {
  active: colors.accent.primary,
  inactive: colors.text.tertiary,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  blur: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  androidBackground: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
});

export default PillTabBarBackground;

