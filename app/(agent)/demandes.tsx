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
  TextInput
} from 'react-native';
import { ScrollView, Spinner, View } from 'tamagui';
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
  MapPin
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase, Demande } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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

type PropositionForm = {
  pharmacie_nom: string;
  prix: string;
  quartier: string;
  adresse: string;
  telephone: string;
};

const emptyProposition: PropositionForm = {
  pharmacie_nom: '',
  prix: '',
  quartier: '',
  adresse: '',
  telephone: '',
};

export default function DemandesScreen() {
  const { session } = useAuth();
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
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demandes' }, () => fetchDemandes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDemandes]);

  const onRefresh = () => { setRefreshing(true); fetchDemandes(); };

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

  const addProposition = () => setPropositions([...propositions, { ...emptyProposition }]);
  const removeProposition = (index: number) => {
    if (propositions.length > 1) setPropositions(propositions.filter((_, i) => i !== index));
  };
  const updateProposition = (index: number, field: keyof PropositionForm, value: string) => {
    const updated = [...propositions];
    updated[index][field] = value;
    setPropositions(updated);
  };

  const submitPropositions = async () => {
    if (!selectedDemande) return;
    const validPropositions = propositions.filter(p => p.pharmacie_nom.trim() && p.prix.trim() && p.quartier.trim());
    if (validPropositions.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une proposition valide');
      return;
    }
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      const { error: propError } = await (supabase.from('propositions') as any).insert(
        validPropositions.map(p => ({
          demande_id: selectedDemande.id,
          pharmacie_nom: p.pharmacie_nom.trim(),
          prix: parseFloat(p.prix),
          quartier: p.quartier.trim(),
          adresse: p.adresse.trim() || null,
          telephone: p.telephone.trim() || null,
          disponible: true,
        }))
      );
      if (propError) throw propError;
      const { error: updateError } = await (supabase.from('demandes') as any).update({ status: 'traite' }).eq('id', selectedDemande.id);
      if (updateError) throw updateError;
      Alert.alert('Succès', 'Propositions envoyées au client');
      closeModal();
      fetchDemandes();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer les propositions');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'en_attente': return { label: 'En attente', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)', icon: Clock };
      case 'en_cours': return { label: 'En cours', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)', icon: AlertCircle };
      case 'traite': return { label: 'Traité', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle };
      default: return { label: status, color: 'rgba(255,255,255,0.5)', bgColor: 'rgba(255, 255, 255, 0.05)', icon: Clock };
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
    { value: 'en_attente' as const, label: 'En attente' },
    { value: 'en_cours' as const, label: 'En cours' },
    { value: 'traite' as const, label: 'Traités' },
    { value: 'all' as const, label: 'Tous' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A1628', '#132F4C', '#0A1628']} style={StyleSheet.absoluteFill} />
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.headerTitle}>Demandes</Text>
          <Text style={styles.headerSubtitle}>{demandes.filter(d => d.status === 'en_attente').length} en attente</Text>
        </Animated.View>

        {/* Filtres */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filters.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[styles.filterButton, filter === f.value && styles.filterButtonActive]}
              >
                <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Liste */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Spinner size="large" color="#10B981" />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : demandes.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}><Pill size={48} color="rgba(255,255,255,0.3)" /></View>
              <Text style={styles.emptyTitle}>Aucune demande</Text>
              <Text style={styles.emptyText}>{filter !== 'all' ? `Pas de demande "${filter.replace('_', ' ')}"` : 'Les nouvelles demandes apparaîtront ici'}</Text>
            </View>
          ) : (
            demandes.map((demande) => {
              const statusConfig = getStatusConfig(demande.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedDemande === demande.id;
              const hasPropositions = demande.propositions && demande.propositions.length > 0;

              return (
                <View key={demande.id} style={styles.demandeCard}>
                  <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
                  <View style={styles.demandeContent}>
                    <Pressable
                      onPress={() => {
                        if (demande.status === 'traite' && hasPropositions) {
                          setExpandedDemande(isExpanded ? null : demande.id);
                        } else if (demande.status !== 'traite') {
                          openResponseModal(demande);
                        }
                      }}
                      style={({ pressed }) => [
                        pressed && styles.demandePressable
                      ]}
                    >
                      <View style={styles.demandeHeader}>
                        <View style={styles.demandeInfo}>
                          <Text style={styles.demandeMedicament} numberOfLines={1}>{demande.medicament_nom}</Text>
                          <View style={styles.demandeClient}>
                            <Phone size={12} color="rgba(255,255,255,0.4)" />
                            <Text style={styles.demandeClientText}>{demande.profiles?.full_name || demande.profiles?.phone || 'Client'}</Text>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                          <StatusIcon size={12} color={statusConfig.color} />
                          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                        </View>
                      </View>
                      {demande.description && <Text style={styles.demandeDescription} numberOfLines={2}>{demande.description}</Text>}
                      <View style={styles.demandeFooter}>
                        <Text style={styles.demandeTime}>{formatDate(demande.created_at)}</Text>
                        {demande.status === 'traite' && hasPropositions ? (
                          <View style={styles.repondreButton}>
                            <Text style={styles.repondreText}>{demande.propositions!.length} proposition{demande.propositions!.length > 1 ? 's' : ''}</Text>
                            <ChevronRight size={16} color="#10B981" style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
                          </View>
                        ) : demande.status !== 'traite' ? (
                          <View style={styles.repondreButton}>
                            <Text style={styles.repondreText}>Répondre</Text>
                            <ChevronRight size={16} color="#10B981" />
                          </View>
                        ) : null}
                      </View>
                    </Pressable>

                    {/* Propositions (demandes traitées) */}
                    {isExpanded && hasPropositions && (
                      <View style={styles.propositionsContainer}>
                        <View style={styles.propositionsDivider} />
                        <Text style={styles.propositionsHeader}>Propositions envoyées</Text>
                        {demande.propositions!.map((prop, index) => (
                          <View key={prop.id} style={styles.propositionItem}>
                            <View style={styles.propositionNumberBadge}>
                              <Text style={styles.propositionNumberBadgeText}>{index + 1}</Text>
                            </View>
                            <View style={styles.propositionDetails}>
                              <Text style={styles.propositionPharmacyName}>{prop.pharmacie_nom}</Text>
                              <View style={styles.propositionRow}>
                                <View style={styles.propositionLocation}>
                                  <MapPin size={12} color="rgba(255,255,255,0.4)" />
                                  <Text style={styles.propositionLocationText}>{prop.quartier}</Text>
                                </View>
                                {prop.adresse && (
                                  <Text style={styles.propositionAddress}> • {prop.adresse}</Text>
                                )}
                              </View>
                              {prop.telephone && (
                                <View style={styles.propositionPhone}>
                                  <Phone size={12} color="rgba(255,255,255,0.4)" />
                                  <Text style={styles.propositionPhoneText}>{prop.telephone}</Text>
                                </View>
                              )}
                              <View style={styles.propositionPriceBadge}>
                                <Text style={styles.propositionPriceText}>{prop.prix.toLocaleString()} FCFA</Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#0A1628', '#132F4C', '#0A1628']} style={StyleSheet.absoluteFill} />
          <SafeAreaView style={styles.modalSafeArea}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Répondre à la demande</Text>
                    <Text style={styles.modalSubtitle}>{selectedDemande?.medicament_nom}</Text>
                  </View>
                  <Pressable onPress={closeModal} style={styles.closeButton}><X size={24} color="rgba(255,255,255,0.6)" /></Pressable>
                </View>

                {/* Modal Content */}
                <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                  {/* Info */}
                  <View style={styles.infoCard}>
                    <Sparkles size={18} color="#00D9FF" />
                    <Text style={styles.infoText}>Ajoutez les pharmacies où le médicament est disponible avec le prix.</Text>
                  </View>

                  {/* Propositions */}
                  {propositions.map((prop, index) => (
                    <View key={index} style={styles.propositionCard}>
                      <View style={styles.propositionHeader}>
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.propositionNumber}>
                          <Text style={styles.propositionNumberText}>{index + 1}</Text>
                        </LinearGradient>
                        <Text style={styles.propositionTitle}>Pharmacie</Text>
                        {propositions.length > 1 && (
                          <Pressable onPress={() => removeProposition(index)} style={styles.deleteButton}>
                            <Trash2 size={18} color="#EF4444" />
                          </Pressable>
                        )}
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Nom de la pharmacie <Text style={styles.required}>*</Text></Text>
                        <TextInput style={styles.input} placeholder="Ex: Pharmacie Centrale" placeholderTextColor="rgba(255,255,255,0.3)" value={prop.pharmacie_nom} onChangeText={(v) => updateProposition(index, 'pharmacie_nom', v)} />
                      </View>

                      <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                          <Text style={styles.label}>Prix (FCFA) <Text style={styles.required}>*</Text></Text>
                          <TextInput style={styles.input} placeholder="2500" placeholderTextColor="rgba(255,255,255,0.3)" value={prop.prix} onChangeText={(v) => updateProposition(index, 'prix', v)} keyboardType="numeric" />
                        </View>
                        <View style={{ width: 12 }} />
                        <View style={[styles.formGroup, { flex: 1 }]}>
                          <Text style={styles.label}>Quartier <Text style={styles.required}>*</Text></Text>
                          <TextInput style={styles.input} placeholder="Plateau" placeholderTextColor="rgba(255,255,255,0.3)" value={prop.quartier} onChangeText={(v) => updateProposition(index, 'quartier', v)} />
                        </View>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.labelOptional}>Adresse (optionnel)</Text>
                        <TextInput style={styles.input} placeholder="Rue du Commerce..." placeholderTextColor="rgba(255,255,255,0.3)" value={prop.adresse} onChangeText={(v) => updateProposition(index, 'adresse', v)} />
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.labelOptional}>Téléphone (optionnel)</Text>
                        <TextInput style={styles.input} placeholder="90 00 00 00" placeholderTextColor="rgba(255,255,255,0.3)" value={prop.telephone} onChangeText={(v) => updateProposition(index, 'telephone', v)} keyboardType="phone-pad" />
                      </View>
                    </View>
                  ))}

                  {/* Add button */}
                  <Pressable onPress={addProposition} style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
                    <Plus size={20} color="#10B981" />
                    <Text style={styles.addButtonText}>Ajouter une pharmacie</Text>
                  </Pressable>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <Pressable onPress={submitPropositions} disabled={submitting} style={({ pressed }) => [styles.submitButton, pressed && !submitting && styles.submitButtonPressed, submitting && styles.submitButtonDisabled]}>
                    <LinearGradient colors={submitting ? ['#374151', '#374151'] : ['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitButtonGradient}>
                      {submitting ? <><Spinner size="small" color="white" /><Text style={styles.submitButtonTextDisabled}>Envoi...</Text></> : <><Send size={20} color="#FFFFFF" /><Text style={styles.submitButtonText}>Envoyer au client</Text></>}
                    </LinearGradient>
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  safeArea: { flex: 1 },
  decorCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(16, 185, 129, 0.03)', top: -50, right: -60 },
  decorCircle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(245, 158, 11, 0.03)', bottom: 200, left: -40 },

  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  filterContainer: { paddingBottom: 12 },
  filterScroll: { paddingHorizontal: 24, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  filterButtonActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  filterText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  filterTextActive: { color: '#FFFFFF' },

  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 120 },

  loadingContainer: { paddingTop: 80, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.5)' },

  emptyCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  emptyText: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },

  demandeCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  demandeCardPressed: { opacity: 0.8 },
  demandePressable: { opacity: 0.8 },
  statusIndicator: { width: 4 },
  demandeContent: { flex: 1, padding: 16 },
  demandeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  demandeInfo: { flex: 1, marginRight: 12 },
  demandeMedicament: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  demandeClient: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  demandeClientText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  demandeDescription: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 10, lineHeight: 20 },
  demandeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  demandeTime: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  repondreButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  repondreText: { fontSize: 14, fontWeight: '600', color: '#10B981' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#0A1628' },
  modalSafeArea: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  modalSubtitle: { fontSize: 15, color: '#00D9FF', fontWeight: '500', marginTop: 2 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },

  infoCard: { flexDirection: 'row', backgroundColor: 'rgba(0, 217, 255, 0.08)', borderRadius: 14, padding: 16, gap: 12, marginBottom: 20, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, color: '#00D9FF', lineHeight: 20 },

  propositionCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  propositionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  propositionNumber: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  propositionNumberText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  propositionTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  deleteButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239, 68, 68, 0.15)', justifyContent: 'center', alignItems: 'center' },

  formGroup: { marginBottom: 14 },
  formRow: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '500', color: '#FFFFFF', marginBottom: 8 },
  labelOptional: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  required: { color: '#EF4444' },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', height: 50, paddingHorizontal: 14, fontSize: 16, color: '#FFFFFF' },

  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#10B981', borderStyle: 'dashed' },
  addButtonPressed: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  addButtonText: { fontSize: 15, fontWeight: '600', color: '#10B981' },

  modalFooter: { paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' },
  submitButton: { borderRadius: 16, overflow: 'hidden' },
  submitButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  submitButtonPressed: { opacity: 0.9 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  submitButtonTextDisabled: { fontSize: 17, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },

  // Propositions affichées dans les demandes traitées
  propositionsContainer: { marginTop: 16 },
  propositionsDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 12 },
  propositionsHeader: { fontSize: 14, fontWeight: '600', color: '#10B981', marginBottom: 12 },
  propositionItem: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start' },
  propositionNumberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  propositionNumberBadgeText: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  propositionDetails: { flex: 1 },
  propositionPharmacyName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 6 },
  propositionRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 },
  propositionLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  propositionLocationText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  propositionAddress: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  propositionPhone: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  propositionPhoneText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  propositionPriceBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  propositionPriceText: { fontSize: 14, fontWeight: '700', color: '#10B981' },
});

