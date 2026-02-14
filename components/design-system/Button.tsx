/**
 * Button Component
 * Modern Apothecary Design System - Premium tactile buttons
 */
import React from 'react';
import {
  StyleSheet,
  Pressable,
  Text,
  View,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: [styles.containerPrimary, shadows.accent],
          text: styles.textPrimary,
        };
      case 'secondary':
        return {
          container: styles.containerSecondary,
          text: styles.textSecondary,
        };
      case 'outline':
        return {
          container: styles.containerOutline,
          text: styles.textOutline,
        };
      case 'ghost':
        return {
          container: styles.containerGhost,
          text: styles.textGhost,
        };
      default:
        return {
          container: styles.containerPrimary,
          text: styles.textPrimary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          text: styles.textSmall,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          text: styles.textLarge,
        };
      default:
        return {
          container: styles.containerMedium,
          text: styles.textMedium,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.text.primary : colors.accent.primary}
        />
      );
    }

    const textElement = (
      <Text
        style={[
          styles.text,
          variantStyles.text,
          sizeStyles.text,
          textStyle,
        ]}
      >
        {title}
      </Text>
    );

    if (!icon) return textElement;

    return (
      <View style={styles.contentRow}>
        {iconPosition === 'left' && (
          <View style={styles.iconLeft}>{icon}</View>
        )}
        {textElement}
        {iconPosition === 'right' && (
          <View style={styles.iconRight}>{icon}</View>
        )}
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.container,
          variantStyles.container,
          sizeStyles.container,
          fullWidth && styles.fullWidth,
          (disabled || loading) && styles.disabled,
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {renderContent()}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  containerPrimary: {
    backgroundColor: colors.accent.primary,
  },
  containerSecondary: {
    backgroundColor: colors.surface.tertiary,
  },
  containerOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  containerGhost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  containerSmall: {
    height: 40,
    paddingHorizontal: spacing.md,
  },
  containerMedium: {
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  containerLarge: {
    height: 60,
    paddingHorizontal: spacing.xl,
  },

  // Text
  text: {
    ...typography.label,
  },
  textPrimary: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  textSecondary: {
    color: colors.text.primary,
  },
  textOutline: {
    color: colors.accent.primary,
    fontWeight: '700',
  },
  textGhost: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 13,
  },
  textMedium: {
    fontSize: 15,
  },
  textLarge: {
    fontSize: 17,
  },

  // Content
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

export default Button;

