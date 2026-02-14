/**
 * OTP Verification Screen
 * Modern Apothecary Design System
 */
import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View as RNView,
  Text,
  Pressable,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Spinner } from 'tamagui';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  BackgroundShapes,
  OTPInput,
  ResendTimer,
  useToast,
} from '../../components/design-system';
import { getErrorMessage } from '../../utils/errors';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { showToast } = useToast();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleVerify = async (code: string) => {
    if (!phone || code.length !== 6) return;

    setLoading(true);
    setError(false);
    Keyboard.dismiss();

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: phone,
        token: code,
        type: 'sms',
      });

      if (verifyError) throw verifyError;

      showToast({
        type: 'success',
        title: 'Connexion réussie',
        message: 'Bienvenue sur PuzzlePharm',
      });

      // Navigation will be handled by auth state change in _layout.tsx
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(true);
      setOtp('');
      showToast({
        type: 'error',
        title: 'Code invalide',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) return;

    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (resendError) throw resendError;

      showToast({
        type: 'success',
        title: 'Code renvoyé',
        message: 'Vérifiez vos SMS',
      });
    } catch (err: any) {
      console.error('Resend error:', err);
      showToast({
        type: 'error',
        title: 'Erreur',
        message: getErrorMessage(err),
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatPhone = (p: string) => {
    if (!p) return '';
    // Format: +227 XX XX XX XX
    const cleaned = p.replace(/\D/g, '');
    if (cleaned.startsWith('227')) {
      const local = cleaned.slice(3);
      return `+227 ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)}`;
    }
    return p;
  };

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundShapes variant="home" />

      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Header */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Retour"
              >
                <ArrowLeft size={24} color={colors.text.primary} />
              </Pressable>
            </Animated.View>

            {/* Content */}
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }],
                },
              ]}
            >
              {/* Icon */}
              <RNView style={styles.iconContainer}>
                <ShieldCheck size={48} color={colors.accent.primary} />
              </RNView>

              {/* Title */}
              <Text style={styles.title}>Vérification</Text>
              <Text style={styles.subtitle}>
                Entrez le code à 6 chiffres envoyé au
              </Text>
              <Text style={styles.phoneNumber}>{formatPhone(phone || '')}</Text>

              {/* OTP Input */}
              <RNView style={styles.otpContainer}>
                <OTPInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerify}
                  error={error}
                  disabled={loading}
                  autoFocus
                />
              </RNView>

              {/* Loading indicator */}
              {loading && (
                <RNView style={styles.loadingContainer}>
                  <Spinner size="small" color={colors.accent.primary} />
                  <Text style={styles.loadingText}>Vérification...</Text>
                </RNView>
              )}

              {/* Resend Timer */}
              {!loading && (
                <ResendTimer
                  seconds={60}
                  onResend={handleResend}
                  disabled={loading}
                />
              )}
            </Animated.View>

            {/* Footer */}
            <Animated.View
              style={[
                styles.footer,
                { opacity: fadeAnim },
              ]}
            >
              <Text style={styles.footerText}>
                Vous n'avez pas reçu de code ?{' '}
                <Text style={styles.footerLink}>Vérifiez vos SMS</Text>
              </Text>
            </Animated.View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  phoneNumber: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  otpContainer: {
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.accent.secondary,
    fontWeight: '500',
  },
});

