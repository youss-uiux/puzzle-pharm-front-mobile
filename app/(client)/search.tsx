/**
 * Search Screen - Client
 * Modern Apothecary Design System
 * Premium search with recent searches, quantity, urgency, auto-navigation
 */
import { useState, useEffect, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Pressable,
  TextInput,
  View as RNView,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Search as SearchIcon,
  Send,
  CheckCircle,
  Sparkles,
  Clock,
  X,
  Minus,
  Plus,
  Zap,
  ArrowRight
} from 'lucide-react-native';
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
  useToast,
} from '../../components/design-system';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { getErrorMessage } from '../../utils/errors';

export default function SearchScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ prefill?: string; description?: string }>();
  const { showToast } = useToast();
  const { recentSearches, addSearch, removeSearch } = useRecentSearches();

  const [medicament, setMedicament] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);


  // Prefill from params (e.g., from relaunch)
  useEffect(() => {
    if (params.prefill) {
      setMedicament(params.prefill);
    }
    if (params.description) {
      setDescription(params.description);
    }
  }, [params]);

  useEffect(() => {
    if (success) {
      // Countdown and auto-navigate
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/(client)/history');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCountdown(3);
    }
  }, [success, router]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleQuantityChange = useCallback((delta: number) => {
    const newQty = Math.max(1, Math.min(99, quantity + delta));
    setQuantity(newQty);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [quantity]);

  const selectRecentSearch = useCallback((search: string) => {
    setMedicament(search);
    Haptics.selectionAsync();
  }, []);

  const submitDemande = async () => {
    if (!medicament.trim()) {
      showToast({
        type: 'error',
        title: 'Champ requis',
        message: 'Veuillez entrer le nom du médicament',
      });
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
          quantity: quantity,
          is_urgent: isUrgent,
          status: 'en_attente'
        });

      if (error) throw error;

      // Save to recent searches
      await addSearch(medicament.trim());

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setMedicament('');
      setDescription('');
      setQuantity(1);
      setIsUrgent(false);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <RNView style={styles.container}>
        <StatusBar style="dark" />

        <SafeAreaView style={styles.successContainer}>
          <RNView style={styles.successContent}>
            <RNView style={styles.successIcon}>
              <CheckCircle size={48} color={colors.surface.primary} />
            </RNView>

            <Text style={styles.successTitle}>Demande envoyée !</Text>
            <Text style={styles.successText}>
              Notre équipe recherche votre médicament.{'\n'}
              Vous serez notifié dès qu'une réponse arrive.
            </Text>

            <RNView style={styles.countdownContainer}>
              <Text style={styles.countdownText}>
                Redirection dans {countdown}s...
              </Text>
              <RNView style={styles.countdownBar}>
                <RNView style={[styles.countdownProgress, { width: `${(countdown / 3) * 100}%` }]} />
              </RNView>
            </RNView>

            <Pressable
              onPress={() => router.push('/(client)/history')}
              style={({ pressed }) => [
                styles.goToHistoryButton,
                pressed && styles.goToHistoryButtonPressed,
              ]}
            >
              <Text style={styles.goToHistoryText}>Voir mes demandes</Text>
              <ArrowRight size={18} color={colors.accent.primary} />
            </Pressable>

            <Pressable
              onPress={() => setSuccess(false)}
              style={styles.newSearchButton}
            >
              <Text style={styles.newSearchText}>Nouvelle recherche</Text>
            </Pressable>
          </RNView>
        </SafeAreaView>
      </RNView>
    );
  }

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />

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
              <RNView style={styles.header}>
                <Text style={styles.headerTitle}>Rechercher</Text>
                <Text style={styles.headerSubtitle}>
                  Trouvez votre médicament en quelques clics
                </Text>
              </RNView>

              {/* Recent Searches */}
              {recentSearches.length > 0 && !medicament && (
                <RNView style={styles.recentContainer}>
                  <RNView style={styles.recentHeader}>
                    <Clock size={14} color={colors.text.tertiary} />
                    <Text style={styles.recentTitle}>Recherches récentes</Text>
                  </RNView>
                  <RNView style={styles.recentChips}>
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <Pressable
                        key={index}
                        onPress={() => selectRecentSearch(search)}
                        style={({ pressed }) => [
                          styles.recentChip,
                          pressed && styles.recentChipPressed,
                        ]}
                      >
                        <Text style={styles.recentChipText}>{search}</Text>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            removeSearch(search);
                          }}
                          hitSlop={8}
                        >
                          <X size={14} color={colors.text.tertiary} />
                        </Pressable>
                      </Pressable>
                    ))}
                  </RNView>
                </RNView>
              )}

              {/* Form Card */}
              <RNView style={styles.formCard}>
                {/* Medication Name */}
                <RNView style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Nom du médicament <Text style={styles.required}>*</Text>
                  </Text>
                  <RNView style={styles.inputContainer}>
                    <SearchIcon size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Doliprane 1000mg"
                      placeholderTextColor={colors.text.tertiary}
                      value={medicament}
                      onChangeText={setMedicament}
                      editable={!loading}
                      selectionColor={colors.accent.primary}
                      accessibilityLabel="Nom du médicament"
                      accessibilityHint="Entrez le nom du médicament recherché"
                    />
                  </RNView>
                </RNView>

                {/* Quantity */}
                <RNView style={styles.inputGroup}>
                  <Text style={styles.label}>Quantité</Text>
                  <RNView style={styles.quantityContainer}>
                    <Pressable
                      onPress={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      style={({ pressed }) => [
                        styles.quantityButton,
                        pressed && styles.quantityButtonPressed,
                        quantity <= 1 && styles.quantityButtonDisabled,
                      ]}
                    >
                      <Minus size={20} color={quantity <= 1 ? colors.text.tertiary : colors.text.primary} />
                    </Pressable>
                    <RNView style={styles.quantityValue}>
                      <Text style={styles.quantityText}>{quantity}</Text>
                    </RNView>
                    <Pressable
                      onPress={() => handleQuantityChange(1)}
                      disabled={quantity >= 99}
                      style={({ pressed }) => [
                        styles.quantityButton,
                        pressed && styles.quantityButtonPressed,
                        quantity >= 99 && styles.quantityButtonDisabled,
                      ]}
                    >
                      <Plus size={20} color={quantity >= 99 ? colors.text.tertiary : colors.text.primary} />
                    </Pressable>
                  </RNView>
                </RNView>

                {/* Urgency Toggle */}
                <RNView style={styles.inputGroup}>
                  <Text style={styles.label}>Priorité</Text>
                  <RNView style={styles.urgencyContainer}>
                    <Pressable
                      onPress={() => {
                        setIsUrgent(false);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.urgencyOption,
                        !isUrgent && styles.urgencyOptionActive,
                      ]}
                    >
                      <Text style={[
                        styles.urgencyText,
                        !isUrgent && styles.urgencyTextActive,
                      ]}>Normal</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setIsUrgent(true);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.urgencyOption,
                        styles.urgencyOptionUrgent,
                        isUrgent && styles.urgencyOptionUrgentActive,
                      ]}
                    >
                      <Zap size={14} color={isUrgent ? colors.error.primary : colors.text.tertiary} />
                      <Text style={[
                        styles.urgencyText,
                        isUrgent && styles.urgencyTextUrgent,
                      ]}>Urgent</Text>
                    </Pressable>
                  </RNView>
                  {isUrgent && (
                    <Text style={styles.urgencyHint}>
                      Votre demande sera traitée en priorité
                    </Text>
                  )}
                </RNView>

                {/* Description */}
                <RNView style={styles.inputGroup}>
                  <Text style={styles.labelOptional}>Informations complémentaires</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Dosage, forme (comprimé, sirop...), autre détail utile..."
                    placeholderTextColor={colors.text.tertiary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={!loading}
                    selectionColor={colors.accent.primary}
                    accessibilityLabel="Informations complémentaires"
                  />
                </RNView>

                {/* Submit */}
                <Pressable
                  onPress={submitDemande}
                  disabled={loading || !medicament.trim()}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && !loading && styles.submitButtonPressed,
                    (loading || !medicament.trim()) && styles.submitButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Envoyer la demande"
                >
                  <RNView style={styles.submitButtonInner}>
                    {loading ? (
                      <>
                        <ActivityIndicator size="small" color={colors.text.primary} />
                        <Text style={styles.submitButtonText}>Envoi en cours...</Text>
                      </>
                    ) : (
                      <>
                        <Send size={20} color={colors.text.primary} />
                        <Text style={styles.submitButtonText}>Envoyer la demande</Text>
                      </>
                    )}
                  </RNView>
                </Pressable>
              </RNView>

              {/* Info Card */}
              <RNView style={styles.infoCard}>
                <Sparkles size={18} color={colors.accent.primary} />
                <Text style={styles.infoText}>
                  Notre équipe recherche dans les pharmacies partenaires et vous répond rapidement.
                </Text>
              </RNView>
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
    paddingBottom: 120,
  },

  // Header
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // Recent Searches
  recentContainer: {
    marginBottom: spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  recentTitle: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  recentChipPressed: {
    backgroundColor: colors.accent.ultraLight,
    borderColor: colors.accent.primary,
  },
  recentChipText: {
    ...typography.bodySmall,
    color: colors.text.primary,
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
  textArea: {
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.border.light,
    minHeight: 100,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },

  // Quantity
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonPressed: {
    backgroundColor: colors.accent.ultraLight,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    minWidth: 48,
    height: 48,
    backgroundColor: colors.accent.ultraLight,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  quantityText: {
    ...typography.h3,
    color: colors.text.primary,
  },

  // Urgency
  urgencyContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  urgencyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.surface.secondary,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  urgencyOptionActive: {
    backgroundColor: colors.accent.ultraLight,
    borderColor: colors.accent.primary,
  },
  urgencyOptionUrgent: {},
  urgencyOptionUrgentActive: {
    backgroundColor: colors.error.light,
    borderColor: colors.error.primary,
  },
  urgencyText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  urgencyTextActive: {
    color: colors.accent.secondary,
  },
  urgencyTextUrgent: {
    color: colors.error.primary,
  },
  urgencyHint: {
    ...typography.caption,
    color: colors.error.primary,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
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

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.accent.ultraLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.accent.secondary,
    lineHeight: 20,
  },

  // Success Screen
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
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
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  countdownContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  countdownText: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  countdownBar: {
    height: 4,
    backgroundColor: colors.surface.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  countdownProgress: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  goToHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.ultraLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
    marginBottom: spacing.md,
  },
  goToHistoryButtonPressed: {
    opacity: 0.7,
  },
  goToHistoryText: {
    ...typography.label,
    color: colors.accent.primary,
  },
  newSearchButton: {
    paddingVertical: spacing.sm,
  },
  newSearchText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
});
