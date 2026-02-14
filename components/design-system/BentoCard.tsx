/**
 * Bento Card Component
 * Modern Apothecary Design System
 */
import React from 'react';
import {
  StyleSheet,
  Pressable,
  ViewStyle,
  View as RNView,
  Animated,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';

type BentoSize = '1x1' | '2x1' | '1x2' | '2x2';

interface BentoCardProps {
  children: React.ReactNode;
  size?: BentoSize;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'filled' | 'outlined' | 'elevated';
  accentColor?: string;
  disabled?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  size = '1x1',
  onPress,
  style,
  variant = 'elevated',
  accentColor,
  disabled = false,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      damping: 15,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  const sizeStyles = getSizeStyles(size);
  const variantStyles = getVariantStyles(variant, accentColor);

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[sizeStyles]}
      >
        <Animated.View
          style={[
            styles.card,
            variantStyles,
            { transform: [{ scale: scaleAnim }] },
            disabled && styles.disabled,
            style,
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <RNView style={[styles.card, sizeStyles, variantStyles, style]}>
      {children}
    </RNView>
  );
};

const getSizeStyles = (size: BentoSize): ViewStyle => {
  switch (size) {
    case '1x1':
      return { width: '47%', aspectRatio: 1 };
    case '2x1':
      return { width: '100%' };
    case '1x2':
      return { width: '47%' };
    case '2x2':
      return { width: '100%', aspectRatio: 1 };
    default:
      return { width: '47%', aspectRatio: 1 };
  }
};

const getVariantStyles = (variant: string, accentColor?: string): ViewStyle => {
  switch (variant) {
    case 'filled':
      return {
        backgroundColor: accentColor || colors.accent.primary,
      };
    case 'outlined':
      return {
        backgroundColor: colors.surface.primary,
        borderWidth: 1.5,
        borderColor: accentColor || colors.border.medium,
      };
    case 'elevated':
    default:
      return {
        backgroundColor: colors.surface.primary,
        ...shadows.md,
      };
  }
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default BentoCard;

