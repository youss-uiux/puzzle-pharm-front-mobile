/**
 * Pharmacies de Garde Management Screen - Agent
 * Système de gestion par semaine - un lot hebdomadaire qui disparaît automatiquement
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
  View as RNView,
  Text,
  FlatList,
} from 'react-native';
import { ScrollView, Spinner } from 'tamagui';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  Trash2,
  Save,
  X,
  Calendar,
  MapPin,
  Phone,
  Clock,
  Building2,
  CheckCircle,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase, PharmacieGarde, PharmaciePublic } from '../../lib/supabase';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  BackgroundShapes,
  useToast,
} from '../../components/design-system';
import { usePharmacies } from '../../hooks/usePharmacies';

// Helper pour obtenir le début et fin de la semaine en cours
const getCurrentWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = début

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    debut: monday.toISOString().split('T')[0],
    fin: sunday.toISOString().split('T')[0],
  };
};

const getNextWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToNextMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    debut: monday.toISOString().split('T')[0],
    fin: sunday.toISOString().split('T')[0],
  };
};


export default function PharmaciesGardeScreen() {
  const { showToast } = useToast();
  const { pharmacies: pharmaciesDB, loading: loadingPharmacies } = usePharmacies();

  const [pharmaciesGarde, setPharmaciesGarde] = useState<PharmacieGarde[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<'current' | 'next'>('current');

  // Pharmacies sélectionnées pour le lot
  const [selectedPharmacies, setSelectedPharmacies] = useState<Set<string>>(new Set());

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

  const fetchPharmaciesGarde = useCallback(async () => {
    try {
      const week = getCurrentWeek();
      const { data, error } = await supabase
        .from('pharmacies_garde')
        .select('*')
        .gte('date_debut', week.debut)
        .lte('date_fin', week.fin)
        .order('nom');

      if (error) throw error;
      setPharmaciesGarde(data || []);
    } catch (error) {
      console.error('Erreur chargement pharmacies de garde:', error);
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les pharmacies de garde',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPharmaciesGarde();
  }, [fetchPharmaciesGarde]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchPharmaciesGarde();
  };

  const openModal = () => {
    setSelectedPharmacies(new Set());
    setSelectedWeek('current');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPharmacies(new Set());
  };

  const togglePharmacySelection = (pharmacyId: string) => {
    const newSelection = new Set(selectedPharmacies);
    if (newSelection.has(pharmacyId)) {
      newSelection.delete(pharmacyId);
    } else {
      newSelection.add(pharmacyId);
    }
    setSelectedPharmacies(newSelection);
    Haptics.selectionAsync();
  };

  const submitForm = async () => {
    if (selectedPharmacies.size === 0) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez sélectionner au moins une pharmacie',
      });
      return;
    }

    Keyboard.dismiss();
    setSubmitting(true);

    try {
      const week = selectedWeek === 'current' ? getCurrentWeek() : getNextWeek();

      // Vérifier si des pharmacies existent déjà pour cette semaine
      const { data: existing } = await supabase
        .from('pharmacies_garde')
        .select('id')
        .gte('date_debut', week.debut)
        .lte('date_fin', week.fin)
        .limit(1);

      if (existing && existing.length > 0) {
        Alert.alert(
          'Semaine déjà définie',
          'Des pharmacies de garde existent déjà pour cette semaine. Voulez-vous les remplacer ?',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => setSubmitting(false) },
            {
              text: 'Remplacer',
              style: 'destructive',
              onPress: async () => {
                await replaceWeekPharmacies(week);
              },
            },
          ]
        );
        return;
      }

      // Créer les entrées pour chaque pharmacie sélectionnée
      const pharmaciesToInsert = Array.from(selectedPharmacies).map((pharmacieId) => {
        const pharmacie = pharmaciesDB.find((p) => p.id === pharmacieId);
        return {
          nom: pharmacie?.nom || '',
          quartier: pharmacie?.quartier || 'Non spécifié',
          telephone: '', // Pas exposé
          adresse: '',
          date_debut: week.debut,
          date_fin: week.fin,
        };
      });

      const { error } = await (supabase
        .from('pharmacies_garde') as any)
        .insert(pharmaciesToInsert);

      if (error) throw error;

      showToast({
        type: 'success',
        title: 'Ajoutées',
        message: `${selectedPharmacies.size} pharmacie(s) de garde définies pour la semaine`,
      });

      closeModal();
      fetchPharmaciesGarde();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Erreur:', error);
      showToast({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible de sauvegarder',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const replaceWeekPharmacies = async (week: { debut: string; fin: string }) => {
    try {
      // Supprimer les anciennes
      await supabase
        .from('pharmacies_garde')
        .delete()
        .gte('date_debut', week.debut)
        .lte('date_fin', week.fin);

      // Créer les nouvelles
      const pharmaciesToInsert = Array.from(selectedPharmacies).map((pharmacieId) => {
        const pharmacie = pharmaciesDB.find((p) => p.id === pharmacieId);
        return {
          nom: pharmacie?.nom || '',
          quartier: pharmacie?.quartier || 'Non spécifié',
          telephone: '',
          adresse: '',
          date_debut: week.debut,
          date_fin: week.fin,
        };
      });

      const { error } = await (supabase
        .from('pharmacies_garde') as any)
        .insert(pharmaciesToInsert);

      if (error) throw error;

      showToast({
        type: 'success',
        title: 'Remplacées',
        message: `${selectedPharmacies.size} pharmacie(s) de garde mises à jour`,
      });

      closeModal();
      fetchPharmaciesGarde();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible de remplacer',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAllWeek = () => {
    if (pharmaciesGarde.length === 0) return;

    Alert.alert(
      'Supprimer la semaine',
      `Supprimer toutes les ${pharmaciesGarde.length} pharmacies de garde de cette semaine ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const week = getCurrentWeek();
              const { error } = await supabase
                .from('pharmacies_garde')
                .delete()
                .gte('date_debut', week.debut)
                .lte('date_fin', week.fin);

              if (error) throw error;

              showToast({
                type: 'success',
                title: 'Supprimées',
                message: 'Pharmacies de garde supprimées',
              });
              fetchPharmaciesGarde();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              showToast({
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de supprimer',
              });
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getWeekDisplay = () => {
    const week = getCurrentWeek();
    return `${formatDate(week.debut)} - ${formatDate(week.fin)}`;
  };

  const renderPharmacieItem = ({ item }: { item: PharmacieGarde }) => {
    return (
      <RNView style={styles.pharmacieCard}>
        <RNView style={styles.pharmacieHeader}>
          <RNView style={styles.pharmacieIcon}>
            <Building2 size={24} color={colors.accent.primary} />
          </RNView>
          <RNView style={styles.pharmacieInfo}>
            <Text style={styles.pharmacieNom}>{item.nom}</Text>
            <RNView style={styles.pharmacieLocation}>
              <MapPin size={12} color={colors.text.tertiary} />
              <Text style={styles.pharmacieQuartier}>{item.quartier}</Text>
            </RNView>
          </RNView>
        </RNView>
      </RNView>
    );
  };

  const renderPharmacySelectionItem = ({ item }: { item: PharmaciePublic }) => {
    const isSelected = selectedPharmacies.has(item.id);

    return (
      <Pressable
        onPress={() => togglePharmacySelection(item.id)}
        style={({ pressed }) => [
          styles.selectionItem,
          isSelected && styles.selectionItemSelected,
          pressed && styles.selectionItemPressed,
        ]}
      >
        <RNView style={styles.selectionIcon}>
          <Building2 size={20} color={isSelected ? colors.accent.primary : colors.text.tertiary} />
        </RNView>
        <RNView style={styles.selectionInfo}>
          <Text style={[styles.selectionNom, isSelected && styles.selectionNomSelected]}>
            {item.nom}
          </Text>
          <Text style={styles.selectionQuartier}>{item.quartier}</Text>
        </RNView>
        {isSelected && (
          <RNView style={styles.checkIcon}>
            <CheckCircle size={24} color={colors.accent.primary} />
          </RNView>
        )}
      </Pressable>
    );
  };


  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundShapes variant="home" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <RNView style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Pharmacies de Garde</Text>
            <Text style={styles.headerSubtitle}>Semaine du {getWeekDisplay()}</Text>
          </RNView>

          <RNView style={styles.headerRight}>
            {pharmaciesGarde.length > 0 ? (
              <Pressable
                onPress={deleteAllWeek}
                style={({ pressed }) => [
                  styles.deleteWeekButton,
                  pressed && styles.deleteWeekButtonPressed,
                ]}
              >
                <Trash2 size={20} color={colors.error.primary} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => openModal()}
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.addButtonPressed,
                ]}
              >
                <Plus size={20} color={colors.text.primary} />
              </Pressable>
            )}
          </RNView>
        </Animated.View>

        {/* Info Badge */}
        {pharmaciesGarde.length > 0 && (
          <RNView style={styles.infoBanner}>
            <Clock size={16} color={colors.success.primary} />
            <Text style={styles.infoBannerText}>
              {pharmaciesGarde.length} pharmacie{pharmaciesGarde.length > 1 ? 's' : ''} de garde cette semaine
            </Text>
          </RNView>
        )}

        {/* Liste */}
        {loading ? (
          <RNView style={styles.loadingContainer}>
            <Spinner size="large" color={colors.accent.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </RNView>
        ) : (
          <FlatList
            data={pharmaciesGarde}
            keyExtractor={(item) => item.id}
            renderItem={renderPharmacieItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <RNView style={styles.emptyContainer}>
                <RNView style={styles.emptyIcon}>
                  <Building2 size={48} color={colors.text.tertiary} />
                </RNView>
                <Text style={styles.emptyTitle}>Aucune pharmacie de garde</Text>
                <Text style={styles.emptyText}>
                  Définissez les pharmacies de garde pour cette semaine
                </Text>
                <Pressable
                  onPress={() => openModal()}
                  style={({ pressed }) => [
                    styles.emptyButton,
                    pressed && styles.emptyButtonPressed,
                  ]}
                >
                  <Plus size={20} color={colors.accent.primary} />
                  <Text style={styles.emptyButtonText}>Définir les pharmacies</Text>
                </Pressable>
              </RNView>
            }
          />
        )}
      </SafeAreaView>

      {/* Modal de sélection multiple */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <RNView style={styles.modalContainer}>
          <SafeAreaView style={styles.modalSafeArea}>
            {/* Modal Header */}
            <RNView style={styles.modalHeader}>
              <RNView>
                <Text style={styles.modalTitle}>Définir les pharmacies de garde</Text>
                <Text style={styles.modalSubtitle}>
                  Sélectionnez les pharmacies pour {selectedWeek === 'current' ? 'cette semaine' : 'la semaine prochaine'}
                </Text>
              </RNView>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <X size={24} color={colors.text.tertiary} />
              </Pressable>
            </RNView>

            {/* Week Selector */}
            <RNView style={styles.weekSelector}>
              <Pressable
                onPress={() => {
                  setSelectedWeek('current');
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.weekOption,
                  selectedWeek === 'current' && styles.weekOptionActive,
                ]}
              >
                <Text style={[
                  styles.weekOptionText,
                  selectedWeek === 'current' && styles.weekOptionTextActive,
                ]}>
                  Cette semaine
                </Text>
                <Text style={styles.weekOptionDate}>{getWeekDisplay()}</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setSelectedWeek('next');
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.weekOption,
                  selectedWeek === 'next' && styles.weekOptionActive,
                ]}
              >
                <Text style={[
                  styles.weekOptionText,
                  selectedWeek === 'next' && styles.weekOptionTextActive,
                ]}>
                  Semaine prochaine
                </Text>
                <Text style={styles.weekOptionDate}>
                  {(() => {
                    const week = getNextWeek();
                    return `${formatDate(week.debut)} - ${formatDate(week.fin)}`;
                  })()}
                </Text>
              </Pressable>
            </RNView>

            {/* Counter */}
            <RNView style={styles.counter}>
              <Text style={styles.counterText}>
                {selectedPharmacies.size} pharmacie{selectedPharmacies.size > 1 ? 's' : ''} sélectionnée{selectedPharmacies.size > 1 ? 's' : ''}
              </Text>
            </RNView>

            {/* Liste de sélection */}
            {loadingPharmacies ? (
              <RNView style={styles.loadingContainer}>
                <Spinner size="large" color={colors.accent.primary} />
              </RNView>
            ) : (
              <FlatList
                data={pharmaciesDB}
                keyExtractor={(item) => item.id}
                renderItem={renderPharmacySelectionItem}
                contentContainerStyle={styles.selectionList}
                showsVerticalScrollIndicator={false}
              />
            )}

            {/* Modal Footer */}
            <RNView style={styles.modalFooter}>
              <Pressable
                onPress={submitForm}
                disabled={submitting || selectedPharmacies.size === 0}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && !submitting && styles.submitButtonPressed,
                  (submitting || selectedPharmacies.size === 0) && styles.submitButtonDisabled,
                ]}
              >
                <RNView style={styles.submitButtonInner}>
                  {submitting ? (
                    <>
                      <Spinner size="small" color={colors.text.primary} />
                      <Text style={styles.submitButtonText}>Enregistrement...</Text>
                    </>
                  ) : (
                    <>
                      <Save size={20} color={colors.text.primary} />
                      <Text style={styles.submitButtonText}>
                        Définir pour {selectedWeek === 'current' ? 'cette semaine' : 'la semaine prochaine'}
                      </Text>
                    </>
                  )}
                </RNView>
              </Pressable>
            </RNView>
          </SafeAreaView>
        </RNView>
      </Modal>
    </RNView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerRight: {
    flexShrink: 0,
  },
  headerTitle: { ...typography.h1, color: colors.text.primary },
  headerSubtitle: { ...typography.body, color: colors.text.tertiary, marginTop: spacing.xs },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.accent,
  },
  addButtonPressed: { opacity: 0.9 },

  deleteWeekButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.error.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteWeekButtonPressed: { opacity: 0.7 },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success.light,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  infoBannerText: {
    ...typography.label,
    color: colors.success.primary,
  },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.text.tertiary, marginTop: spacing.md },

  // Liste
  listContent: { padding: spacing.lg, paddingBottom: 100 },

  // Pharmacie Card
  pharmacieCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },

  pharmacieHeader: { flexDirection: 'row', alignItems: 'center' },
  pharmacieIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pharmacieInfo: { flex: 1 },
  pharmacieNom: { ...typography.h4, color: colors.text.primary, marginBottom: spacing.xs },
  pharmacieLocation: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pharmacieQuartier: { ...typography.body, color: colors.text.secondary },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent.light,
    borderRadius: radius.button,
  },
  emptyButtonPressed: { opacity: 0.8 },
  emptyButtonText: { ...typography.label, color: colors.accent.primary },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.surface.primary },
  modalSafeArea: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: { ...typography.h4, color: colors.text.primary },
  modalSubtitle: { ...typography.body, color: colors.text.tertiary, marginTop: spacing.xs },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Week Selector
  weekSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  weekOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  weekOptionActive: {
    backgroundColor: colors.accent.ultraLight,
    borderColor: colors.accent.primary,
  },
  weekOptionText: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  weekOptionTextActive: {
    color: colors.accent.primary,
    fontWeight: '700',
  },
  weekOptionDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Counter
  counter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  counterText: {
    ...typography.label,
    color: colors.accent.primary,
    textAlign: 'center',
  },

  // Selection List
  selectionList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectionItemSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.ultraLight,
  },
  selectionItemPressed: {
    opacity: 0.8,
  },
  selectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionNom: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: 2,
  },
  selectionNomSelected: {
    color: colors.accent.primary,
  },
  selectionQuartier: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },

  // Modal Footer
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  submitButton: { borderRadius: radius.button, overflow: 'hidden' },
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
  submitButtonPressed: { opacity: 0.9 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { ...typography.label, fontSize: 17, fontWeight: '700', color: colors.text.primary },
});

