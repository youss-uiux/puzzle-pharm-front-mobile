/**
 * Login Screen
 * Modern Apothecary Design System
 * Premium authentication with OTP flow
 */
import { useState, useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  View as RNView,
  Text,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  BackgroundShapes,
  useToast,
} from '../../components/design-system';
import { getErrorMessage } from '../../utils/errors';


export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session, profile, isLoading } = useAuth();
  const { showToast } = useToast();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && session && profile) {
      // Check if profile needs setup
      if (!profile.full_name) {
        router.replace('/(auth)/setup-profile');
        return;
      }

      if (profile.role === 'AGENT') {
        router.replace('/(agent)/dashboard');
      } else {
        router.replace('/(client)/home');
      }
    }
  }, [session, profile, isLoading]);

  const formatPhoneNumber = (value: string) => {
    return value.replace(/[^\d+]/g, '');
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhoneNumber(value));
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLogin = async () => {
    if (!phone || phone.length < 8) {
      showToast({
        type: 'error',
        title: 'Numéro invalide',
        message: 'Veuillez entrer un numéro de téléphone valide',
      });
      return;
    }

    dismissKeyboard();
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+227${phone}`;

      // Temporary: Use password-based auth until OTP is configured
      // Password format: puzzle_{phone}_temp
      const password = `puzzle_${formattedPhone}_temp`;

      // Try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password: password,
      });

      if (signInError) {
        // If user doesn't exist, create account
        if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            phone: formattedPhone,
            password: password,
            options: {
              data: { phone: formattedPhone }
            }
          });

          if (signUpError) {
            if (signUpError.message.includes('User already registered')) {
              showToast({
                type: 'error',
                title: 'Compte existant',
                message: 'Ce numéro est déjà enregistré. Contactez le support si vous ne pouvez pas vous connecter.',
              });
            } else {
              throw signUpError;
            }
          } else {
            // Try to sign in after signup
            const { error: loginAfterSignUp } = await supabase.auth.signInWithPassword({
              phone: formattedPhone,
              password: password,
            });
            if (loginAfterSignUp) throw loginAfterSignUp;

            showToast({
              type: 'success',
              title: 'Bienvenue !',
              message: 'Votre compte a été créé avec succès.',
            });
          }
        } else {
          throw signInError;
        }
      } else {
        showToast({
          type: 'success',
          title: 'Connexion réussie',
          message: 'Bienvenue sur PuzzlePharm',
        });
      }

      // Navigation handled by useProtectedRoute in _layout.tsx

    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      showToast({
        type: 'error',
        title: 'Erreur',
        message: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };


  if (isLoading) {
    return (
      <RNView style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <BackgroundShapes variant="home" />
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <RNView style={styles.loadingLogo}>
            <Text style={styles.loadingEmoji}>💊</Text>
          </RNView>
        </Animated.View>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </RNView>
    );
  }

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundShapes variant="home" />

      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Logo animé */}
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { scale: scaleAnim }
                    ]
                  }
                ]}
              >
                <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }] }]}>
                  <RNView style={styles.logo}>
                    <Text style={styles.logoEmoji}>💊</Text>
                  </RNView>
                  <RNView style={styles.logoGlow} />
                </Animated.View>

                <Text style={styles.appName}>PuzzlePharm</Text>
                <RNView style={styles.taglineContainer}>
                  <Sparkles size={14} color={colors.accent.primary} />
                  <Text style={styles.tagline}>Vos médicaments, simplement</Text>
                </RNView>
              </Animated.View>

              {/* Form Card */}
              <Animated.View
                style={[
                  styles.formCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.5) }]
                  }
                ]}
              >
                <RNView style={styles.formHeader}>
                  <Text style={styles.formTitle}>Connexion</Text>
                  <Text style={styles.formSubtitle}>
                    Entrez votre numéro de téléphone
                  </Text>
                </RNView>

                <RNView style={styles.inputWrapper}>
                  <RNView style={styles.inputContainer}>
                    <RNView style={styles.countryCode}>
                      <Text style={styles.flag}>🇳🇪</Text>
                      <Text style={styles.countryCodeText}>+227</Text>
                    </RNView>
                    <RNView style={styles.inputDivider} />
                    <TextInput
                      style={styles.input}
                      placeholder="90 84 84 24"
                      placeholderTextColor={colors.text.tertiary}
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      selectionColor={colors.accent.primary}
                      accessibilityLabel="Numéro de téléphone"
                      accessibilityHint="Entrez votre numéro de téléphone"
                    />
                  </RNView>
                </RNView>

                {/* Submit Button */}
                <Pressable
                  onPress={handleLogin}
                  disabled={loading || !phone}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && !loading && styles.submitButtonPressed,
                    (!phone || loading) && styles.submitButtonDisabled
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Continuer"
                >
                  <RNView style={styles.submitButtonInner}>
                    {loading ? (
                      <>
                        <ActivityIndicator size="small" color={colors.text.primary} />
                        <Text style={styles.submitButtonText}>Connexion...</Text>
                      </>
                    ) : (
                      <Text style={styles.submitButtonText}>Se connecter</Text>
                    )}
                  </RNView>
                </Pressable>
              </Animated.View>

              {/* Footer */}
              <Animated.View style={[styles.footerContainer, { opacity: fadeAnim }]}>
                <Text style={styles.footer}>
                  En continuant, vous acceptez nos{' '}
                  <Text style={styles.footerLink}>conditions d'utilisation</Text>
                </Text>
              </Animated.View>
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingLogo: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    backgroundColor: colors.accent.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  loadingEmoji: {
    fontSize: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    justifyContent: 'center',
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: radius.card,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.accent,
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: radius.card,
    backgroundColor: colors.accent.primary,
    opacity: 0.3,
    top: 0,
    left: 0,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    ...typography.display,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: colors.text.tertiary,
  },

  // Form Card
  formCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  formHeader: {
    marginBottom: spacing.lg,
  },
  formTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // Input
  inputWrapper: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface.tertiary,
  },
  flag: {
    fontSize: 22,
  },
  countryCodeText: {
    ...typography.label,
    color: colors.text.primary,
  },
  inputDivider: {
    width: 2,
    height: 32,
    backgroundColor: colors.border.light,
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },

  // Submit Button
  submitButton: {
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  submitButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    ...shadows.accent,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.label,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
  },
  footer: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.text.tertiary,
    lineHeight: 20,
  },
  footerLink: {
    color: colors.accent.primary,
    fontWeight: '500',
  },
});
