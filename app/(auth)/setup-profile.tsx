/**
 * Profile Setup Screen
 * First-time profile completion after registration
 */
import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View as RNView,
  Text,
  TextInput,
  Pressable,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Spinner } from 'tamagui';
import { User, Sparkles } from 'lucide-react-native';
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

export default function SetupProfileScreen() {
  const router = useRouter();
  const { session, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Pre-fill if profile has data
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      showToast({
        type: 'error',
        title: 'Nom requis',
        message: 'Veuillez entrer votre nom complet',
      });
      return;
    }

    if (!session?.user?.id) return;

    setLoading(true);
    Keyboard.dismiss();

    try {
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Refresh profile in context if available
      if (refreshProfile) {
        await refreshProfile();
      }

      showToast({
        type: 'success',
        title: 'Profil créé',
        message: 'Bienvenue sur PuzzlePharm !',
      });

      // Small delay to ensure profile is updated
      setTimeout(() => {
        // Navigate to appropriate home based on role
        if (profile?.role === 'AGENT') {
          router.replace('/(agent)/dashboard');
        } else {
          router.replace('/(client)/home');
        }
      }, 500);
    } catch (err: any) {
      console.error('Profile update error:', err);
      showToast({
        type: 'error',
        title: 'Erreur',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundShapes variant="profile" />

      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                <RNView style={styles.iconContainer}>
                  <Sparkles size={48} color={colors.accent.primary} />
                </RNView>
                <Text style={styles.title}>Bienvenue !</Text>
                <Text style={styles.subtitle}>
                  Complétez votre profil pour commencer
                </Text>
              </Animated.View>

              {/* Form */}
              <Animated.View
                style={[
                  styles.formCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }],
                  },
                ]}
              >
                {/* Full Name */}
                <RNView style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Nom complet <Text style={styles.required}>*</Text>
                  </Text>
                  <RNView style={styles.inputContainer}>
                    <User size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Votre nom et prénom"
                      placeholderTextColor={colors.text.tertiary}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      autoComplete="name"
                      returnKeyType="done"
                      editable={!loading}
                      selectionColor={colors.accent.primary}
                      accessibilityLabel="Nom complet"
                      accessibilityHint="Entrez votre nom et prénom"
                    />
                  </RNView>
                </RNView>

                {/* Submit Button */}
                <Pressable
                  onPress={handleSave}
                  disabled={loading || !fullName.trim()}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && !loading && styles.submitButtonPressed,
                    (loading || !fullName.trim()) && styles.submitButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Continuer"
                >
                  <RNView style={styles.submitButtonInner}>
                    {loading ? (
                      <>
                        <Spinner size="small" color={colors.text.primary} />
                        <Text style={styles.submitButtonText}>Enregistrement...</Text>
                      </>
                    ) : (
                      <Text style={styles.submitButtonText}>Continuer</Text>
                    )}
                  </RNView>
                </Pressable>
              </Animated.View>

              {/* Footer */}
              <Animated.View
                style={[
                  styles.footer,
                  { opacity: fadeAnim },
                ]}
              >
                <Text style={styles.footerText}>
                  Vos informations sont protégées et ne seront pas partagées
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
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  formCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  labelOptional: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  inputIcon: {
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  hint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  submitButton: {
    borderRadius: radius.button,
    overflow: 'hidden',
    marginTop: spacing.md,
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
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

