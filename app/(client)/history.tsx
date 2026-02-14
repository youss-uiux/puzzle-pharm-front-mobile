/**
 * History Screen - Client
 * Modern Apothecary Design System
 * Demandes history with premium card design
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshControl, Linking, StyleSheet, Platform, Pressable, Animated, View as RNView, Text } from 'react-native';
import { ScrollView, Spinner, View } from 'tamagui';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase, Demande, Proposition } from '../../lib/supabase';
import { useAuth } from '../_layout';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  BackgroundShapes,
} from '../../components/design-system';

type DemandeWithPropositions = Demande & {
  propositions: Proposition[];
};

export default function HistoryScreen() {
  const { session } = useAuth();
  const [demandes, setDemandes] = useState<DemandeWithPropositions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    if (!session?.user.id) return;

    try {
      const { data, error } = await supabase
        .from('demandes')
        .select(`
          *,
          propositions (*)
        `)
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDemandes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    fetchDemandes();

    const demandesChannel = supabase
      .channel('client-demandes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demandes',
          filter: `client_id=eq.${session?.user.id}`,
        },
        () => {
          fetchDemandes();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'propositions',
        },
        () => {
          fetchDemandes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(demandesChannel);
    };
  }, [fetchDemandes, session?.user.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDemandes();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'en_attente':
        return { label: 'En attente', color: colors.warning.primary, bgColor: colors.warning.light, icon: Clock };
      case 'en_cours':
        return { label: 'En cours', color: colors.info.primary, bgColor: colors.info.light, icon: AlertCircle };
      case 'traite':
        return { label: 'Traité', color: colors.success.primary, bgColor: colors.success.light, icon: CheckCircle };
      default:
        return { label: status, color: colors.text.tertiary, bgColor: colors.surface.secondary, icon: Clock };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const callPharmacy = (telephone: string) => {
    if (telephone) {
      Linking.openURL(`tel:${telephone}`);
    }
  };

  const toggleExpanded = (demandeId: string) => {
    setExpandedDemande(expandedDemande === demandeId ? null : demandeId);
  };

  return (
    <RNView style={styles.container}>
      <StatusBar style="light" />
      <BackgroundShapes variant="home" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.primary}
            />
          }
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
            <Text style={styles.headerTitle}>Mes demandes</Text>
            <Text style={styles.headerSubtitle}>
              Suivez l'état de vos recherches
            </Text>
          </Animated.View>

          {/* Liste */}
          {loading ? (
            <RNView style={styles.loadingContainer}>
              <Spinner size="large" color={colors.accent.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </RNView>
          ) : demandes.length === 0 ? (
            <Animated.View
              style={[
                styles.emptyCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }]
                }
              ]}
            >
              <RNView style={styles.emptyIcon}>
                <FileText size={48} color={colors.text.tertiary} />
              </RNView>
              <Text style={styles.emptyTitle}>Aucune demande</Text>
              <Text style={styles.emptyText}>
                Vous n'avez pas encore effectué de recherche
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }]
              }}
            >
              {demandes.map((demande, index) => {
                const statusConfig = getStatusConfig(demande.status);
                const StatusIcon = statusConfig.icon;
                const isExpanded = expandedDemande === demande.id;
                const hasPropositions = demande.propositions && demande.propositions.length > 0;

                return (
                  <RNView key={demande.id} style={styles.demandeCard}>
                    {/* Header */}
                    <RNView style={styles.demandeHeader}>
                      <RNView style={styles.demandeInfo}>
                        <Text style={styles.demandeMedicament}>{demande.medicament_nom}</Text>
                        {demande.description && (
                          <Text style={styles.demandeDescription} numberOfLines={2}>
                            {demande.description}
                          </Text>
                        )}
                        <Text style={styles.demandeDate}>{formatDate(demande.created_at)}</Text>
                      </RNView>
                      <RNView style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        <StatusIcon size={12} color={statusConfig.color} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </Text>
                      </RNView>
                    </RNView>

                    {/* Propositions */}
                    {hasPropositions && (
                      <>
                        <Pressable
                          onPress={() => toggleExpanded(demande.id)}
                          style={({ pressed }) => [
                            styles.propositionsToggle,
                            pressed && styles.propositionsTogglePressed
                          ]}
                        >
                          <Text style={styles.propositionsCount}>
                            {demande.propositions.length} pharmacie{demande.propositions.length > 1 ? 's' : ''} disponible{demande.propositions.length > 1 ? 's' : ''}
                          </Text>
                          {isExpanded ? (
                            <ChevronUp size={20} color={colors.accent.primary} />
                          ) : (
                            <ChevronDown size={20} color={colors.accent.primary} />
                          )}
                        </Pressable>

                        {isExpanded && (
                          <RNView style={styles.propositionsList}>
                            {demande.propositions.map((proposition) => (
                              <RNView key={proposition.id} style={styles.propositionCard}>
                                <RNView style={styles.propositionInfo}>
                                  <Text style={styles.propositionName}>{proposition.pharmacie_nom}</Text>
                                  <RNView style={styles.propositionLocation}>
                                    <MapPin size={12} color={colors.text.tertiary} />
                                    <Text style={styles.propositionAddress}>
                                      {proposition.quartier}
                                      {proposition.adresse && ` - ${proposition.adresse}`}
                                    </Text>
                                  </RNView>
                                  <RNView style={styles.priceBadge}>
                                    <Text style={styles.priceText}>
                                      {proposition.prix.toLocaleString()} FCFA
                                    </Text>
                                  </RNView>
                                </RNView>

                                {proposition.telephone && (
                                  <Pressable
                                    onPress={() => callPharmacy(proposition.telephone!)}
                                    style={({ pressed }) => [
                                      styles.callButton,
                                      pressed && styles.callButtonPressed
                                    ]}
                                  >
                                    <RNView style={styles.callButtonInner}>
                                      <Phone size={18} color={colors.text.primary} />
                                    </RNView>
                                  </Pressable>
                                )}
                              </RNView>
                            ))}
                          </RNView>
                        )}
                      </>
                    )}
                  </RNView>
                );
              })}
            </Animated.View>
          )}
          <RNView style={{ height: 120 }} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.text.tertiary,
  },

  // Loading
  loadingContainer: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.text.tertiary,
  },

  // Empty
  emptyCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.md,
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
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Demande Card
  demandeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.md,
  },
  demandeHeader: {
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  demandeInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  demandeMedicament: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  demandeDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  demandeDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },

  // Propositions
  propositionsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  propositionsTogglePressed: {
    backgroundColor: colors.surface.secondary,
  },
  propositionsCount: {
    ...typography.label,
    color: colors.accent.primary,
  },
  propositionsList: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  propositionCard: {
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  propositionInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  propositionName: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  propositionLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  propositionAddress: {
    ...typography.caption,
    color: colors.text.tertiary,
    flex: 1,
  },
  priceBadge: {
    backgroundColor: colors.success.light,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  priceText: {
    ...typography.label,
    color: colors.success.primary,
  },
  callButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  callButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  callButtonInner: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.accent,
  },
});

