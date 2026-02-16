/**
 * Demandes Screen - Agent
 * Modern Apothecary Design System
 * List and manage medication requests - Pharmacies from database only
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Pressable,
  Animated,
  TextInput,
  View as RNView,
  Text
} from 'react-native';
import { ScrollView, Spinner } from 'tamagui';
import * as Haptics from 'expo-haptics';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  X,
  Phone,
  ChevronRight,
  Pill,
  Sparkles,
  MapPin,
  Ban
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase, Demande, PharmaciePublic } from '../../lib/supabase';
import { useAuth } from '../_layout';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  BackgroundShapes,
  PharmacyPicker,
  useToast,
} from '../../components/design-system';

type DemandeWithClient = Demande & {
  profiles: {
    phone: string;
    full_name: string | null;
  };
  propositions?: Array<{
    id: string;
    pharmacie_nom: string;
    prix: number;
    quartier: string;
    adresse: string | null;
    telephone: string | null;
  }>;
};

// Structure pour une proposition avec pharmacie sélectionnée
type PropositionForm = {
  pharmacie: PharmaciePublic | null;
  prix: string;
};

const emptyProposition: PropositionForm = {
  pharmacie: null,
  prix: '',
};

export default function DemandesScreen() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [demandes, setDemandes] = useState<DemandeWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<DemandeWithClient | null>(null);
  const [propositions, setPropositions] = useState<PropositionForm[]>([{ ...emptyProposition }]);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'en_cours' | 'traite'>('en_attente');
  const [expandedDemande, setExpandedDemande] = useState<string | null>(null);

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

  const fetchDemandes = useCallback(async () => {
    try {
      let query = supabase
        .from('demandes')
        .select(`
          *,
          profiles:client_id (phone, full_name),
          propositions (id, pharmacie_nom, prix, quartier, adresse, telephone)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDemandes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDemandes();
    const channel = supabase
      .channel('agent-demandes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demandes' }, () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchDemandes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDemandes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchDemandes();
  };

  const openResponseModal = async (demande: DemandeWithClient) => {
    setSelectedDemande(demande);
    setPropositions([{ ...emptyProposition }]);
    setModalVisible(true);
    if (demande.status === 'en_attente') {
      await (supabase.from('demandes') as any).update({ status: 'en_cours', agent_id: session?.user.id }).eq('id', demande.id);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDemande(null);
    setPropositions([{ ...emptyProposition }]);
  };

  const addProposition = () => {
    setPropositions([...propositions, { ...emptyProposition }]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeProposition = (index: number) => {
    if (propositions.length > 1) {
      setPropositions(propositions.filter((_, i) => i !== index));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const updatePropositionPharmacy = (index: number, pharmacy: PharmaciePublic) => {
    const updated = [...propositions];
    updated[index].pharmacie = pharmacy;
    setPropositions(updated);
  };

  const updatePropositionPrice = (index: number, prix: string) => {
    const updated = [...propositions];
    updated[index].prix = prix;
    setPropositions(updated);
  };

  // Marquer comme non disponible
  const markAsUnavailable = async () => {
    if (!selectedDemande) return;

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
              // Créer une proposition "Non disponible"
              const { error: propError } = await (supabase.from('propositions') as any).insert({
                demande_id: selectedDemande.id,
                pharmacie_nom: 'Non disponible',
                prix: 0,
                quartier: '-',
                disponible: false,
              });
              if (propError) throw propError;

              const { error: updateError } = await (supabase.from('demandes') as any)
                .update({ status: 'traite' })
                .eq('id', selectedDemande.id);
              if (updateError) throw updateError;

              showToast({
                type: 'info',
                title: 'Demande traitée',
                message: 'Le client a été informé de l\'indisponibilité',
              });
              closeModal();
              fetchDemandes();
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
    if (!selectedDemande) return;

    const validPropositions = propositions.filter(p => p.pharmacie && p.prix.trim());

    if (validPropositions.length === 0) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez ajouter au moins une proposition valide',
      });
      return;
    }

    // Confirmation avant envoi
    const confirmMessage = `${validPropositions.length} proposition${validPropositions.length > 1 ? 's' : ''} pour "${selectedDemande.medicament_nom}" — Envoyer ?`;

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
                  demande_id: selectedDemande.id,
                  pharmacie_id: p.pharmacie!.id,
                  pharmacie_nom: p.pharmacie!.nom,
                  prix: parseFloat(p.prix),
                  quartier: p.pharmacie!.quartier,
                  adresse: null, // L'adresse sera récupérée depuis la table pharmacies si besoin
                  telephone: null, // Ne pas exposer le téléphone au client
                  disponible: true,
                }))
              );
              if (propError) throw propError;

              const { error: updateError } = await (supabase.from('demandes') as any)
                .update({ status: 'traite' })
                .eq('id', selectedDemande.id);
              if (updateError) throw updateError;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast({
                type: 'success',
                title: 'Envoyé !',
                message: 'Propositions envoyées au client',
              });
              closeModal();
              fetchDemandes();
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'en_attente': return { label: 'En attente', color: colors.warning.primary, bgColor: colors.warning.light, icon: Clock };
      case 'en_cours': return { label: 'En cours', color: colors.info.primary, bgColor: colors.info.light, icon: AlertCircle };
      case 'traite': return { label: 'Traité', color: colors.success.primary, bgColor: colors.success.light, icon: CheckCircle };
      default: return { label: status, color: colors.text.tertiary, bgColor: colors.surface.secondary, icon: Clock };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const filters = [
    { value: 'en_attente' as const, label: 'En attente', count: demandes.filter(d => d.status === 'en_attente').length },
    { value: 'en_cours' as const, label: 'En cours', count: demandes.filter(d => d.status === 'en_cours').length },
    { value: 'traite' as const, label: 'Traités', count: demandes.filter(d => d.status === 'traite').length },
    { value: 'all' as const, label: 'Tous', count: demandes.length },
  ];

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundShapes variant="home" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.headerTitle}>Demandes</Text>
          <Text style={styles.headerSubtitle}>{demandes.filter(d => d.status === 'en_attente').length} en attente</Text>
        </Animated.View>

        {/* Filtres avec badges */}
        <RNView style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filters.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => {
                  setFilter(f.value);
                  Haptics.selectionAsync();
                }}
                style={[styles.filterButton, filter === f.value && styles.filterButtonActive]}
              >
                <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
                {f.count > 0 && (
                  <RNView style={[styles.filterBadge, filter === f.value && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, filter === f.value && styles.filterBadgeTextActive]}>
                      {f.count}
                    </Text>
                  </RNView>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </RNView>

        {/* Liste */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <RNView style={styles.loadingContainer}>
              <Spinner size="large" color={colors.accent.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </RNView>
          ) : demandes.length === 0 ? (
            <RNView style={styles.emptyCard}>
              <RNView style={styles.emptyIcon}><Pill size={48} color={colors.text.tertiary} /></RNView>
              <Text style={styles.emptyTitle}>Aucune demande</Text>
              <Text style={styles.emptyText}>{filter !== 'all' ? `Pas de demande "${filter.replace('_', ' ')}"` : 'Les nouvelles demandes apparaîtront ici'}</Text>
            </RNView>
          ) : (
            demandes.map((demande) => {
              const statusConfig = getStatusConfig(demande.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedDemande === demande.id;
              const hasPropositions = demande.propositions && demande.propositions.length > 0;
              const isUrgent = (demande as any).is_urgent;

              return (
                <RNView key={demande.id} style={styles.demandeCard}>
                  <RNView style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
                  <RNView style={styles.demandeContent}>
                    <Pressable
                      onPress={() => {
                        if (demande.status === 'traite' && hasPropositions) {
                          setExpandedDemande(isExpanded ? null : demande.id);
                        } else if (demande.status !== 'traite') {
                          openResponseModal(demande);
                        }
                      }}
                      style={({ pressed }) => [pressed && styles.demandePressable]}
                    >
                      <RNView style={styles.demandeHeader}>
                        <RNView style={styles.demandeInfo}>
                          <RNView style={styles.demandeTitleRow}>
                            <Text style={styles.demandeMedicament} numberOfLines={1}>{demande.medicament_nom}</Text>
                            {isUrgent && (
                              <RNView style={styles.urgentBadge}>
                                <Sparkles size={10} color={colors.error.primary} />
                                <Text style={styles.urgentText}>Urgent</Text>
                              </RNView>
                            )}
                          </RNView>
                          <RNView style={styles.demandeClient}>
                            <Phone size={12} color={colors.text.tertiary} />
                            <Text style={styles.demandeClientText}>{demande.profiles?.full_name || demande.profiles?.phone || 'Client'}</Text>
                          </RNView>
                        </RNView>
                        <RNView style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                          <StatusIcon size={12} color={statusConfig.color} />
                          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                        </RNView>
                      </RNView>
                      {demande.description && <Text style={styles.demandeDescription} numberOfLines={2}>{demande.description}</Text>}
                      <RNView style={styles.demandeFooter}>
                        <Text style={styles.demandeTime}>{formatDate(demande.created_at)}</Text>
                        {demande.status === 'traite' && hasPropositions ? (
                          <RNView style={styles.repondreButton}>
                            <Text style={styles.repondreText}>{demande.propositions!.length} proposition{demande.propositions!.length > 1 ? 's' : ''}</Text>
                            <ChevronRight size={16} color={colors.accent.primary} style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
                          </RNView>
                        ) : demande.status !== 'traite' ? (
                          <RNView style={styles.repondreButton}>
                            <Text style={styles.repondreText}>Répondre</Text>
                            <ChevronRight size={16} color={colors.accent.primary} />
                          </RNView>
                        ) : null}
                      </RNView>
                    </Pressable>

                    {/* Propositions (demandes traitées) */}
                    {isExpanded && hasPropositions && (
                      <RNView style={styles.propositionsContainer}>
                        <RNView style={styles.propositionsDivider} />
                        <Text style={styles.propositionsHeader}>Propositions envoyées</Text>
                        {demande.propositions!.map((prop, index) => (
                          <RNView key={prop.id} style={styles.propositionItem}>
                            <RNView style={styles.propositionNumberBadge}>
                              <Text style={styles.propositionNumberBadgeText}>{index + 1}</Text>
                            </RNView>
                            <RNView style={styles.propositionDetails}>
                              <Text style={styles.propositionPharmacyName}>{prop.pharmacie_nom}</Text>
                              <RNView style={styles.propositionRow}>
                                <RNView style={styles.propositionLocation}>
                                  <MapPin size={12} color={colors.text.tertiary} />
                                  <Text style={styles.propositionLocationText}>{prop.quartier}</Text>
                                </RNView>
                              </RNView>
                              <RNView style={styles.propositionPriceBadge}>
                                <Text style={styles.propositionPriceText}>{prop.prix.toLocaleString()} FCFA</Text>
                              </RNView>
                            </RNView>
                          </RNView>
                        ))}
                      </RNView>
                    )}
                  </RNView>
                </RNView>
              );
            })
          )}
          <RNView style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modal de réponse */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <RNView style={styles.modalContainer}>
          <SafeAreaView style={styles.modalSafeArea}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* Modal Header */}
                <RNView style={styles.modalHeader}>
                  <RNView>
                    <Text style={styles.modalTitle}>Répondre à la demande</Text>
                    <Text style={styles.modalSubtitle}>{selectedDemande?.medicament_nom}</Text>
                  </RNView>
                  <Pressable onPress={closeModal} style={styles.closeButton}><X size={24} color={colors.text.tertiary} /></Pressable>
                </RNView>

                {/* Modal Content */}
                <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                  {/* Info */}
                  <RNView style={styles.infoCard}>
                    <Sparkles size={18} color={colors.accent.primary} />
                    <Text style={styles.infoText}>Sélectionnez les pharmacies où le médicament est disponible et indiquez le prix.</Text>
                  </RNView>

                  {/* Propositions */}
                  {propositions.map((prop, index) => (
                    <RNView key={index} style={styles.propositionCard}>
                      <RNView style={styles.propositionHeaderModal}>
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

                      {/* Sélecteur de pharmacie */}
                      <RNView style={styles.formGroup}>
                        <Text style={styles.label}>Pharmacie <Text style={styles.required}>*</Text></Text>
                        <PharmacyPicker
                          selectedPharmacy={prop.pharmacie}
                          onSelect={(pharmacy) => updatePropositionPharmacy(index, pharmacy)}
                          placeholder="Sélectionner une pharmacie"
                          error={false}
                        />
                      </RNView>

                      {/* Prix */}
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

                      {/* Afficher le quartier si pharmacie sélectionnée */}
                      {prop.pharmacie && (
                        <RNView style={styles.selectedPharmacyInfo}>
                          <MapPin size={14} color={colors.text.tertiary} />
                          <Text style={styles.selectedPharmacyQuartier}>{prop.pharmacie.quartier}</Text>
                        </RNView>
                      )}
                    </RNView>
                  ))}

                  {/* Bouton ajouter */}
                  <Pressable onPress={addProposition} style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
                    <Plus size={20} color={colors.accent.primary} />
                    <Text style={styles.addButtonText}>Ajouter une pharmacie</Text>
                  </Pressable>

                  {/* Bouton Non disponible */}
                  <Pressable onPress={markAsUnavailable} disabled={submitting} style={({ pressed }) => [styles.unavailableButton, pressed && styles.unavailableButtonPressed]}>
                    <Ban size={18} color={colors.error.primary} />
                    <Text style={styles.unavailableButtonText}>Médicament non disponible</Text>
                  </Pressable>
                </ScrollView>

                {/* Modal Footer */}
                <RNView style={styles.modalFooter}>
                  <Pressable onPress={submitPropositions} disabled={submitting} style={({ pressed }) => [styles.submitButton, pressed && !submitting && styles.submitButtonPressed, submitting && styles.submitButtonDisabled]}>
                    <RNView style={styles.submitButtonInner}>
                      {submitting ? (
                        <>
                          <Spinner size="small" color={colors.text.primary} />
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
            </TouchableWithoutFeedback>
          </SafeAreaView>
        </RNView>
      </Modal>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  safeArea: { flex: 1 },

  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  headerTitle: { ...typography.h1, color: colors.text.primary },
  headerSubtitle: { ...typography.body, color: colors.text.tertiary, marginTop: spacing.xs },

  filterContainer: { paddingBottom: spacing.md },
  filterScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: radius.md,
    ...shadows.sm
  },
  filterButtonActive: { backgroundColor: colors.accent.primary },
  filterText: { ...typography.label, color: colors.text.secondary },
  filterTextActive: { color: colors.text.primary },
  filterBadge: {
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(26, 26, 26, 0.15)',
  },
  filterBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
    color: colors.text.tertiary,
  },
  filterBadgeTextActive: {
    color: colors.text.primary,
  },

  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 20 },

  loadingContainer: { paddingTop: spacing.xxxl, alignItems: 'center' },
  loadingText: { marginTop: spacing.md, ...typography.body, color: colors.text.tertiary },

  emptyCard: { backgroundColor: colors.surface.primary, borderRadius: radius.card, padding: spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border.light, ...shadows.sm },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },

  demandeCard: { backgroundColor: colors.surface.primary, borderRadius: radius.card, marginBottom: spacing.md, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light, ...shadows.sm },
  demandePressable: { opacity: 0.8 },
  statusIndicator: { width: 4 },
  demandeContent: { flex: 1, padding: spacing.lg },
  demandeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  demandeInfo: { flex: 1, marginRight: spacing.md },
  demandeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  demandeMedicament: { ...typography.h4, color: colors.text.primary },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.error.light, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  urgentText: { ...typography.caption, color: colors.error.primary, fontWeight: '600', fontSize: 10 },
  demandeClient: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  demandeClientText: { ...typography.caption, color: colors.text.tertiary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  statusText: { ...typography.caption, fontWeight: '600' },
  demandeDescription: { ...typography.body, color: colors.text.secondary, marginTop: spacing.sm, lineHeight: 20 },
  demandeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.light },
  demandeTime: { ...typography.caption, color: colors.text.tertiary },
  repondreButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  repondreText: { ...typography.label, color: colors.accent.primary },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.surface.primary },
  modalSafeArea: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.light },
  modalTitle: { ...typography.h4, color: colors.text.primary },
  modalSubtitle: { ...typography.body, color: colors.accent.primary, marginTop: spacing.xs },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface.secondary, justifyContent: 'center', alignItems: 'center' },
  modalContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  infoCard: { flexDirection: 'row', backgroundColor: colors.accent.ultraLight, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, marginBottom: spacing.lg, alignItems: 'flex-start' },
  infoText: { flex: 1, ...typography.bodySmall, color: colors.accent.secondary, lineHeight: 20 },

  propositionCard: { backgroundColor: colors.surface.secondary, borderRadius: radius.card, padding: spacing.lg, marginBottom: spacing.md },
  propositionHeaderModal: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
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

  modalFooter: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.light },
  submitButton: { borderRadius: radius.button, overflow: 'hidden' },
  submitButtonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, backgroundColor: colors.accent.primary, borderRadius: radius.button, ...shadows.accent },
  submitButtonPressed: { opacity: 0.9 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { ...typography.label, fontSize: 17, fontWeight: '700', color: colors.text.primary },

  // Propositions affichées dans les demandes traitées
  propositionsContainer: { marginTop: spacing.md },
  propositionsDivider: { height: 1, backgroundColor: colors.border.light, marginBottom: spacing.md },
  propositionsHeader: { ...typography.label, color: colors.accent.primary, marginBottom: spacing.md },
  propositionItem: { backgroundColor: colors.surface.secondary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'flex-start' },
  propositionNumberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent.light, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md, marginTop: 2 },
  propositionNumberBadgeText: { ...typography.caption, fontWeight: '700', color: colors.accent.primary },
  propositionDetails: { flex: 1 },
  propositionPharmacyName: { ...typography.label, color: colors.text.primary, marginBottom: spacing.xs },
  propositionRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: spacing.sm },
  propositionLocation: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  propositionLocationText: { ...typography.caption, color: colors.text.secondary },
  propositionPriceBadge: { backgroundColor: colors.success.light, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  propositionPriceText: { ...typography.label, color: colors.success.primary },
});

