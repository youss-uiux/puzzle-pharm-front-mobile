/**
 * Search Bar Component
 * Modern Apothecary Design System - Organic, premium search input
 */
import React from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Animated,
  TextInputProps,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  showClearButton?: boolean;
  variant?: 'default' | 'elevated' | 'filled';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
  placeholder = 'Rechercher...',
  showClearButton = true,
  variant = 'elevated',
  ...rest
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const focusAnim = React.useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border.light, colors.accent.primary],
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return styles.containerFilled;
      case 'elevated':
        return styles.containerElevated;
      default:
        return styles.containerDefault;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getVariantStyles(),
        { transform: [{ scale: scaleAnim }], borderColor },
      ]}
    >
      <View style={styles.iconContainer}>
        <Search
          size={20}
          color={isFocused ? colors.accent.primary : colors.text.tertiary}
          strokeWidth={2.5}
        />
      </View>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectionColor={colors.accent.primary}
        {...rest}
      />

      {showClearButton && value.length > 0 && (
        <Pressable
          onPress={handleClear}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.clearButtonPressed,
          ]}
          hitSlop={8}
        >
          <View style={styles.clearButtonInner}>
            <X size={14} color={colors.text.inverse} strokeWidth={3} />
          </View>
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: radius.xl,
    borderWidth: 2,
    overflow: 'hidden',
  },
  containerDefault: {
    backgroundColor: colors.surface.secondary,
  },
  containerFilled: {
    backgroundColor: colors.surface.tertiary,
  },
  containerElevated: {
    backgroundColor: colors.surface.primary,
    ...shadows.md,
  },
  iconContainer: {
    width: 56,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    ...typography.body,
    color: colors.text.primary,
    paddingRight: spacing.md,
  },
  clearButton: {
    marginRight: spacing.md,
  },
  clearButtonPressed: {
    opacity: 0.7,
  },
  clearButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchBar;

