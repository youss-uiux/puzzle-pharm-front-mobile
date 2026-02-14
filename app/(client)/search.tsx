/**
 * Search Screen - Client
 * Modern Apothecary Design System
 * Premium search experience with tactile interactions
 */
import { useState, useRef, useEffect } from 'react';
import {
  Alert,
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
} from 'react-native';
import { ScrollView, Spinner, View } from 'tamagui';
import { Search as SearchIcon, Send, CheckCircle, Sparkles, Pill } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  BackgroundShapes,
  Button,
} from '../../components/design-system';

export default function SearchScreen() {
  const { session } = useAuth();
  const [medicament, setMedicament] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (success) {
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      successScale.setValue(0);
    }
  }, [success]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const submitDemande = async () => {
    if (!medicament.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du médicament');
      return;
    }

    dismissKeyboard();
    setLoading(true);
    try {
      const { error } = await (supabase
        .from('demandes') as any)
        .insert({
          client_id: session?.user.id,
          medicament_nom: medicament.trim(),
          description: description.trim() || null,
          status: 'en_attente'
        });

      if (error) throw error;

      setSuccess(true);
      setMedicament('');
      setDescription('');

      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer la demande');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <RNView style={styles.container}>
        <StatusBar style="dark" />
        <BackgroundShapes variant="search" />

        <SafeAreaView style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successContent,
              { transform: [{ scale: successScale }] }
            ]}
          >
            <RNView style={styles.successIcon}>
              <CheckCircle size={48} color={colors.surface.primary} />
            </RNView>

            <Text style={styles.successTitle}>Demande envoyée !</Text>
            <Text style={styles.successText}>
              Notre équipe recherche votre médicament.{'\n'}
              Vous serez notifié dès qu'une réponse arrive.
            </Text>

            <Button
              title="Nouvelle recherche"
              onPress={() => setSuccess(false)}
              variant="primary"
              size="large"
              fullWidth
            />
          </Animated.View>
        </SafeAreaView>
      </RNView>
    );
  }

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundShapes variant="search" />

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
              {/* Header */}
              <Animated.View
                style={[
                  styles.header,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <RNView style={styles.headerIconContainer}>
                  <RNView style={styles.headerIcon}>
                    <Pill size={24} color={colors.text.primary} />
                  </RNView>
                </RNView>
                <Text style={styles.headerTitle}>Rechercher</Text>
                <Text style={styles.headerSubtitle}>
                  Décrivez le médicament que vous cherchez
                </Text>
              </Animated.View>

              {/* Form Card */}
              <Animated.View
                style={[
                  styles.formCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }]
                  }
                ]}
              >
                {/* Nom du médicament */}
                <RNView style={styles.formGroup}>
                  <Text style={styles.label}>
                    Nom du médicament <Text style={styles.required}>*</Text>
                  </Text>
                  <RNView style={styles.inputContainer}>
                    <SearchIcon size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Doliprane 1000mg..."
                      placeholderTextColor={colors.text.tertiary}
                      value={medicament}
                      onChangeText={setMedicament}
                      returnKeyType="next"
                      selectionColor={colors.accent.primary}
                    />
                  </RNView>
                </RNView>

                {/* Description */}
                <RNView style={styles.formGroup}>
                  <Text style={styles.labelOptional}>Détails (optionnel)</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Dosage, forme, marque..."
                    placeholderTextColor={colors.text.tertiary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    selectionColor={colors.accent.primary}
                  />
                </RNView>
              </Animated.View>

              {/* Info Card */}
              <Animated.View
                style={[
                  styles.infoCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.4) }]
                  }
                ]}
              >
                <Sparkles size={18} color={colors.accent.primary} />
                <Text style={styles.infoText}>
                  Notre équipe vous répond en temps réel avec les pharmacies disponibles.
                </Text>
              </Animated.View>

              {/* Submit Button */}
              <Animated.View
                style={[
                  styles.buttonContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.6) }]
                  }
                ]}
              >
                <Pressable
                  onPress={submitDemande}
                  disabled={loading || !medicament.trim()}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && !loading && styles.submitButtonPressed,
                    (!medicament.trim() || loading) && styles.submitButtonDisabled
                  ]}
                >
                  <RNView style={styles.submitButtonInner}>
                    {loading ? (
                      <>
                        <Spinner size="small" color={colors.text.primary} />
                        <Text style={styles.submitButtonText}>Envoi...</Text>
                      </>
                    ) : (
                      <>
                        <Send size={20} color={colors.text.primary} />
                        <Text style={styles.submitButtonText}>Envoyer la demande</Text>
                      </>
                    )}
                  </RNView>
                </Pressable>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
    flexGrow: 1,
  },

  // Header
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.accent,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
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
  formGroup: {
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
  textArea: {
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.border.light,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    minHeight: 120,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.accent.ultraLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.accent.secondary,
    lineHeight: 20,
  },

  // Submit Button
  buttonContainer: {
    marginBottom: spacing.lg,
  },
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
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },

  // Success State
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  successTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  successText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
});
