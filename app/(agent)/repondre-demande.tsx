import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Alert,
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
  ActivityIndicator
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  Trash2,
  Send,
  X,
  MapPin,
  Ban,
  Sparkles,
  ArrowLeft
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase, Demande, PharmaciePublic } from '../../lib/supabase';
import { useAuth } from '../_layout';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  PharmacyPicker,
  useToast,
} from '../../components/design-system';

type DemandeWithClient = Demande & {
  profiles: {
    phone: string;
    full_name: string | null;
  };
};

type PropositionForm = {
  pharmacie: PharmaciePublic | null;
  prix: string;
};

const emptyProposition: PropositionForm = {
  pharmacie: null,
  prix: '',
};

export default function RepondreDemandeScreen() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [demande, setDemande] = useState<DemandeWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [propositions, setPropositions] = useState<PropositionForm[]>([{ ...emptyProposition }]);
  const [submitting, setSubmitting] = useState(false);

  const fetchDemande = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('demandes')
        .select(`
          *,
          profiles:client_id (phone, full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setDemande(data);
      
      // Passer le statut à 'en_cours' si ce n'est pas déjà fait
      if (data.status === 'en_attente') {
        await (supabase.from('demandes') as any)
          .update({ status: 'en_cours', agent_id: session?.user.id })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la demande:', error);
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger la demande',
      });
      router.navigate('/(agent)/demandes');
    } finally {
      setLoading(false);
    }
  }, [id, session, router, showToast]);

  useEffect(() => {
    fetchDemande();
  }, [fetchDemande]);

  const addProposition = useCallback(() => {
    setPropositions([...propositions, { ...emptyProposition }]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [propositions]);

  const removeProposition = useCallback((index: number) => {
    if (propositions.length > 1) {
      setPropositions(propositions.filter((_, i) => i !== index));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [propositions]);

  const updatePropositionPharmacy = useCallback((index: number, pharmacy: PharmaciePublic) => {
    const updated = [...propositions];
    updated[index].pharmacie = pharmacy;
    setPropositions(updated);
  }, [propositions]);

  const updatePropositionPrice = useCallback((index: number, prix: string) => {
    const updated = [...propositions];
    updated[index].prix = prix;
    setPropositions(updated);
  }, [propositions]);

  const markAsUnavailable = async () => {
    if (!demande) return;

    Alert.alert(
      'Médicament non disponible',
      'Confirmer que ce médicament n\'est pas disponible dans les pharmacies partenaires ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const { error: propError } = await (supabase.from('propositions') as any).insert({
                demande_id: demande.id,
                pharmacie_nom: 'Non disponible',
                prix: 0,
                quartier: '-',
                disponible: false,
              });
              if (propError) throw propError;

              const { error: updateError } = await (supabase.from('demandes') as any)
                .update({ status: 'traite' })
                .eq('id', demande.id);
              if (updateError) throw updateError;

              showToast({
                type: 'info',
                title: 'Demande traitée',
                message: 'Le client a été informé de l\'indisponibilité',
              });
              router.replace('/(agent)/demandes');
            } catch (error: any) {
              showToast({
                type: 'error',
                title: 'Erreur',
                message: error.message || 'Impossible de traiter la demande',
              });
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const submitPropositions = async () => {
    if (!demande) return;

    const validPropositions = propositions.filter(p => p.pharmacie && p.prix.trim());

    if (validPropositions.length === 0) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez ajouter au moins une proposition valide',
      });
      return;
    }

    const confirmMessage = `${validPropositions.length} proposition${validPropositions.length > 1 ? 's' : ''} pour "${demande.medicament_nom}" — Envoyer ?`;

    Alert.alert(
      'Confirmer l\'envoi',
      confirmMessage,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            Keyboard.dismiss();
            setSubmitting(true);
            try {
              const { error: propError } = await (supabase.from('propositions') as any).insert(
                validPropositions.map(p => ({
                  demande_id: demande.id,
                  pharmacie_id: p.pharmacie!.id,
                  pharmacie_nom: p.pharmacie!.nom,
                  prix: parseFloat(p.prix),
                  quartier: p.pharmacie!.quartier,
                  adresse: null,
                  telephone: null,
                  disponible: true,
                }))
              );
              if (propError) throw propError;

              const { error: updateError } = await (supabase.from('demandes') as any)
                .update({ status: 'traite' })
                .eq('id', demande.id);
              if (updateError) throw updateError;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast({
                type: 'success',
                title: 'Envoyé !',
                message: 'Propositions envoyées au client',
              });
              router.replace('/(agent)/demandes');
            } catch (error: any) {
              showToast({
                type: 'error',
                title: 'Erreur',
                message: error.message || 'Impossible d\'envoyer les propositions',
              });
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <RNView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </RNView>
    );
  }

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <RNView style={styles.header}>
            <Pressable onPress={() => router.navigate('/(agent)/demandes')} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text.primary} />
            </Pressable>
            <RNView style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Résoudre la demande</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>{demande?.medicament_nom}</Text>
            </RNView>
          </RNView>

          <ScrollView 
            style={styles.content} 
            keyboardShouldPersistTaps="handled" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <RNView style={styles.infoCard}>
              <Sparkles size={18} color={colors.accent.primary} />
              <Text style={styles.infoText}>Sélectionnez les pharmacies où le médicament est disponible et indiquez le prix.</Text>
            </RNView>

            {propositions.map((prop, index) => (
              <RNView key={index} style={styles.propositionCard}>
                <RNView style={styles.propositionHeader}>
                  <RNView style={styles.propositionNumber}>
                    <Text style={styles.propositionNumberText}>{index + 1}</Text>
                  </RNView>
                  <Text style={styles.propositionTitle}>Pharmacie</Text>
                  {propositions.length > 1 && (
                    <Pressable onPress={() => removeProposition(index)} style={styles.deleteButton}>
                      <Trash2 size={18} color={colors.error.primary} />
                    </Pressable>
                  )}
                </RNView>

                <RNView style={styles.formGroup}>
                  <Text style={styles.label}>Pharmacie <Text style={styles.required}>*</Text></Text>
                  <PharmacyPicker
                    selectedPharmacy={prop.pharmacie}
                    onSelect={(pharmacy) => updatePropositionPharmacy(index, pharmacy)}
                    placeholder="Sélectionner une pharmacie"
                    error={false}
                  />
                </RNView>

                <RNView style={styles.formGroup}>
                  <Text style={styles.label}>Prix (FCFA) <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 2500"
                    placeholderTextColor={colors.text.tertiary}
                    value={prop.prix}
                    onChangeText={(v) => updatePropositionPrice(index, v)}
                    keyboardType="numeric"
                    selectionColor={colors.accent.primary}
                  />
                </RNView>

                {prop.pharmacie && (
                  <RNView style={styles.selectedPharmacyInfo}>
                    <MapPin size={14} color={colors.text.tertiary} />
                    <Text style={styles.selectedPharmacyQuartier}>{prop.pharmacie.quartier}</Text>
                  </RNView>
                )}
              </RNView>
            ))}

            <Pressable onPress={addProposition} style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
              <Plus size={20} color={colors.accent.primary} />
              <Text style={styles.addButtonText}>Ajouter une pharmacie</Text>
            </Pressable>

            <Pressable onPress={markAsUnavailable} disabled={submitting} style={({ pressed }) => [styles.unavailableButton, pressed && styles.unavailableButtonPressed]}>
              <Ban size={18} color={colors.error.primary} />
              <Text style={styles.unavailableButtonText}>Médicament non disponible</Text>
            </Pressable>
          </ScrollView>

          <RNView style={styles.footer}>
            <Pressable 
              onPress={submitPropositions} 
              disabled={submitting} 
              style={({ pressed }) => [
                styles.submitButton, 
                pressed && !submitting && styles.submitButtonPressed, 
                submitting && styles.submitButtonDisabled
              ]}
            >
              <RNView style={styles.submitButtonInner}>
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color={colors.text.primary} />
                    <Text style={styles.submitButtonText}>Envoi...</Text>
                  </>
                ) : (
                  <>
                    <Send size={20} color={colors.text.primary} />
                    <Text style={styles.submitButtonText}>Envoyer au client</Text>
                  </>
                )}
              </RNView>
            </Pressable>
          </RNView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.md, 
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.surface.primary
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.surface.secondary
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: { ...typography.h3, color: colors.text.primary, fontSize: 18 },
  headerSubtitle: { ...typography.body, color: colors.accent.primary, fontSize: 14 },
  
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 40 },
  
  infoCard: { flexDirection: 'row', backgroundColor: colors.accent.ultraLight, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, marginBottom: spacing.lg, alignItems: 'flex-start' },
  infoText: { flex: 1, ...typography.bodySmall, color: colors.accent.secondary, lineHeight: 20 },
  
  propositionCard: { backgroundColor: colors.surface.secondary, borderRadius: radius.card, padding: spacing.lg, marginBottom: spacing.md, ...shadows.sm },
  propositionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  propositionNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  propositionNumberText: { ...typography.label, color: colors.text.primary },
  propositionTitle: { flex: 1, ...typography.h4, color: colors.text.primary },
  deleteButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.error.light, justifyContent: 'center', alignItems: 'center' },
  
  formGroup: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text.primary, marginBottom: spacing.sm },
  required: { color: colors.error.primary },
  input: { backgroundColor: colors.surface.primary, borderRadius: radius.button, borderWidth: 2, borderColor: colors.border.light, height: 52, paddingHorizontal: spacing.md, ...typography.body, color: colors.text.primary },
  
  selectedPharmacyInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.sm },
  selectedPharmacyQuartier: { ...typography.caption, color: colors.text.secondary },
  
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.button, borderWidth: 2, borderColor: colors.accent.primary, borderStyle: 'dashed', marginBottom: spacing.md },
  addButtonPressed: { backgroundColor: colors.accent.ultraLight },
  addButtonText: { ...typography.label, color: colors.accent.primary },
  
  unavailableButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.button, backgroundColor: colors.error.light },
  unavailableButtonPressed: { opacity: 0.7 },
  unavailableButtonText: { ...typography.label, color: colors.error.primary },
  
  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.light, backgroundColor: colors.surface.primary },
  submitButton: { borderRadius: radius.button, overflow: 'hidden' },
  submitButtonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, backgroundColor: colors.accent.primary, borderRadius: radius.button, ...shadows.accent },
  submitButtonPressed: { opacity: 0.9 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { ...typography.label, fontSize: 17, fontWeight: '700', color: colors.text.primary },
});
