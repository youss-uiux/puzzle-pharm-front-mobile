/**
 * OTP Input Component
 * 6-digit code input with auto-advance and paste support
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  autoFocus = true,
  error = false,
  disabled = false,
}) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Split value into individual digits
  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  useEffect(() => {
    if (error) {
      // Shake animation on error
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);

  useEffect(() => {
    // Auto-focus first input
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleChange = (text: string, index: number) => {
    if (disabled) return;

    // Handle paste (multiple characters)
    if (text.length > 1) {
      const pastedValue = text.replace(/[^0-9]/g, '').slice(0, length);
      onChange(pastedValue);

      if (pastedValue.length === length) {
        Keyboard.dismiss();
        onComplete?.(pastedValue);
      } else {
        inputRefs.current[pastedValue.length]?.focus();
      }
      return;
    }

    // Handle single digit
    const newDigits = [...digits];
    newDigits[index] = text.replace(/[^0-9]/g, '');
    const newValue = newDigits.join('');
    onChange(newValue);

    // Auto-advance to next input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (text && index === length - 1) {
      const completeValue = newValue.replace(/[^0-9]/g, '');
      if (completeValue.length === length) {
        Keyboard.dismiss();
        onComplete?.(completeValue);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace on empty input
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      onChange(newDigits.join(''));
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: shakeAnim }] },
      ]}
    >
      {digits.map((digit, index) => {
        const isFocused = focusedIndex === index;
        const hasValue = digit !== '';

        return (
          <Pressable
            key={index}
            onPress={() => focusInput(index)}
            style={[
              styles.inputContainer,
              isFocused && styles.inputFocused,
              hasValue && styles.inputFilled,
              error && styles.inputError,
              disabled && styles.inputDisabled,
            ]}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.input,
                hasValue && styles.inputTextFilled,
                error && styles.inputTextError,
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              keyboardType="number-pad"
              maxLength={index === 0 ? length : 1} // Allow paste on first input
              selectTextOnFocus
              editable={!disabled}
              caretHidden
              accessibilityLabel={`Digit ${index + 1} of ${length}`}
              accessibilityHint="Enter a single digit"
            />
            {isFocused && !hasValue && <View style={styles.cursor} />}
          </Pressable>
        );
      })}
    </Animated.View>
  );
};

// Countdown Timer for resend OTP
interface ResendTimerProps {
  seconds: number;
  onResend: () => void;
  disabled?: boolean;
}

export const ResendTimer: React.FC<ResendTimerProps> = ({
  seconds: initialSeconds,
  onResend,
  disabled = false,
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [seconds]);

  const handleResend = () => {
    if (canResend && !disabled) {
      onResend();
      setSeconds(initialSeconds);
      setCanResend(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.resendContainer}>
      {canResend ? (
        <Pressable
          onPress={handleResend}
          disabled={disabled}
          style={({ pressed }) => [
            styles.resendButton,
            pressed && styles.resendButtonPressed,
            disabled && styles.resendButtonDisabled,
          ]}
        >
          <Text style={styles.resendButtonText}>Renvoyer le code</Text>
        </Pressable>
      ) : (
        <Text style={styles.resendTimer}>
          Renvoyer dans {formatTime(seconds)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  inputContainer: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  inputFocused: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.surface.primary,
    ...shadows.sm,
  },
  inputFilled: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.ultraLight,
  },
  inputError: {
    borderColor: colors.error.primary,
    backgroundColor: colors.error.light,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: colors.surface.tertiary,
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  inputTextFilled: {
    color: colors.text.primary,
  },
  inputTextError: {
    color: colors.error.primary,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: colors.accent.primary,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  resendTimer: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  resendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  resendButtonPressed: {
    opacity: 0.7,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    ...typography.label,
    color: colors.accent.primary,
  },
});

export default OTPInput;

