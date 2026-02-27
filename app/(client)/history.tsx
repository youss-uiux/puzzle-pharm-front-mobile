/**
 * History Screen - Client
 * Modern Apothecary Design System
 * Demandes history with filters, best price badge, and relaunch
 */
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { RefreshControl, Linking, StyleSheet, Pressable, Animated, View as RNView, Text, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  FileText,
  Navigation,
  RefreshCw,
  Award,
  Sparkles
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
  StatusTabs,
  EmptyState,
  SkeletonList,
  useToast,
} from '../../components/design-system';

type DemandeWithPropositions = Demande & {
  propositions: Proposition[];
};

export default function HistoryScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [demandes, setDemandes] = useState<DemandeWithPropositions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDemande, setExpandedDemande] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast({
            type: 'success',
            title: 'Nouvelle proposition',
            message: 'Un agent a répondu à votre demande',
          });
          fetchDemandes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(demandesChannel);
    };
  }, [fetchDemandes, session?.user.id, showToast]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchDemandes();
  };

  // Filter demandes
  const filteredDemandes = useMemo(() =>
    filter === 'all' ? demandes : demandes.filter(d => d.status === filter),
    [filter, demandes]
  );

  // Stats for tabs
  const stats = useMemo(() => ({
    all: demandes.length,
    en_attente: demandes.filter(d => d.status === 'en_attente').length,
    en_cours: demandes.filter(d => d.status === 'en_cours').length,
    traite: demandes.filter(d => d.status === 'traite').length,
  }), [demandes]);

  const getStatusConfig = useCallback((status: string) => {
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
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Check if demande is stale (older than 24h)
  const isStale = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours > 24;
  }, []);

  const callPharmacy = useCallback((telephone: string) => {
    if (telephone) {
      Linking.openURL(`tel:${telephone}`);
    }
  }, []);

  const openMaps = useCallback((pharmacyName: string, address?: string | null, quartier?: string) => {
    const query = address || `${pharmacyName} ${quartier}`;
    const url = `https://maps.google.com/?q=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  }, []);

  const toggleExpanded = (demandeId: string) => {
    setExpandedDemande(expandedDemande === demandeId ? null : demandeId);
  };

  // Relaunch a demande
  const handleRelaunch = (demande: DemandeWithPropositions) => {
    Alert.alert(
      'Relancer la recherche',
      `Voulez-vous créer une nouvelle demande pour "${demande.medicament_nom}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Relancer',
          onPress: () => {
            router.push({
              pathname: '/(client)/search',
              params: {
                prefill: demande.medicament_nom,
                description: demande.description || '',
              },
            });
          },
        },
      ]
    );
  };

  // Find cheapest proposition
  const getCheapestProposition = (propositions: Proposition[]) => {
    if (!propositions || propositions.length === 0) return null;
    return propositions.reduce((min, p) => p.prix < min.prix ? p : min, propositions[0]);
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

        {/* Filter Tabs */}
        <StatusTabs
          activeStatus={filter}
          onStatusChange={setFilter}
          counts={stats}
          showAll={true}
        />

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
          {/* Liste */}
          {loading ? (
            <SkeletonList count={3} />
          ) : filteredDemandes.length === 0 ? (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }],
                marginHorizontal: spacing.lg,
              }}
            >
              <EmptyState
                variant="history"
                title={filter !== 'all' ? `Aucune demande "${getStatusConfig(filter).label.toLowerCase()}"` : undefined}
                actionLabel={filter === 'all' ? 'Rechercher un médicament' : undefined}
                onAction={filter === 'all' ? () => router.push('/(client)/search') : undefined}
              />
            </Animated.View>
          ) : (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }]
              }}
            >
              {filteredDemandes.map((demande) => {
                const statusConfig = getStatusConfig(demande.status);
                const StatusIcon = statusConfig.icon;
                const isExpanded = expandedDemande === demande.id;
                const hasPropositions = demande.propositions && demande.propositions.length > 0;
                const cheapest = getCheapestProposition(demande.propositions);
                const showRelaunch = demande.status === 'en_attente' && isStale(demande.created_at);

                return (
                  <RNView key={demande.id} style={styles.demandeCard}>
                    {/* Header */}
                    <Pressable
                      onPress={() => hasPropositions && toggleExpanded(demande.id)}
                      style={({ pressed }) => pressed && hasPropositions ? { opacity: 0.8 } : {}}
                    >
                      <RNView style={styles.demandeHeader}>
                        <RNView style={styles.demandeInfo}>
                          <RNView style={styles.medicamentRow}>
                            <Text style={styles.demandeMedicament}>{demande.medicament_nom}</Text>
                            {(demande as any).is_urgent && (
                              <RNView style={styles.urgentBadge}>
                                <Sparkles size={10} color={colors.error.primary} />
                                <Text style={styles.urgentText}>Urgent</Text>
                              </RNView>
                            )}
                          </RNView>
                          {demande.description && (
                            <Text style={styles.demandeDescription} numberOfLines={2}>
                              {demande.description}
                            </Text>
                          )}
                          <Text style={styles.demandeDate}>{formatDate(demande.created_at)}</Text>
                        </RNView>
                        <RNView style={styles.headerRight}>
                          <RNView style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                            <StatusIcon size={12} color={statusConfig.color} />
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                              {statusConfig.label}
                            </Text>
                          </RNView>
                          {hasPropositions && (
                            <RNView style={styles.expandIcon}>
                              {isExpanded ? (
                                <ChevronUp size={20} color={colors.text.tertiary} />
                              ) : (
                                <ChevronDown size={20} color={colors.text.tertiary} />
                              )}
                            </RNView>
                          )}
                        </RNView>
                      </RNView>
                    </Pressable>

                    {/* Propositions count */}
                    {hasPropositions && !isExpanded && (
                      <RNView style={styles.propositionsPreview}>
                        <Text style={styles.propositionsCount}>
                          {demande.propositions.length} proposition{demande.propositions.length > 1 ? 's' : ''} disponible{demande.propositions.length > 1 ? 's' : ''}
                        </Text>
                        {cheapest && (
                          <Text style={styles.cheapestPreview}>
                            à partir de {cheapest.prix.toLocaleString()} FCFA
                          </Text>
                        )}
                      </RNView>
                    )}

                    {/* Relaunch button for stale demandes */}
                    {showRelaunch && (
                      <Pressable
                        onPress={() => handleRelaunch(demande)}
                        style={({ pressed }) => [
                          styles.relaunchButton,
                          pressed && styles.relaunchButtonPressed,
                        ]}
                      >
                        <RefreshCw size={16} color={colors.accent.primary} />
                        <Text style={styles.relaunchText}>Relancer la recherche</Text>
                      </Pressable>
                    )}

                    {/* Expanded Propositions */}
                    {isExpanded && hasPropositions && (
                      <RNView style={styles.propositionsContainer}>
                        <RNView style={styles.propositionsDivider} />
                        <Text style={styles.propositionsTitle}>
                          {demande.propositions.length} pharmacie{demande.propositions.length > 1 ? 's' : ''} trouvée{demande.propositions.length > 1 ? 's' : ''}
                        </Text>

                        {demande.propositions
                          .sort((a, b) => a.prix - b.prix)
                          .map((prop, idx) => {
                            const isCheapest = cheapest?.id === prop.id && demande.propositions.length > 1;

                            return (
                              <RNView
                                key={prop.id}
                                style={[
                                  styles.propositionCard,
                                  isCheapest && styles.propositionCardCheapest,
                                ]}
                              >
                                {isCheapest && (
                                  <RNView style={styles.bestPriceBadge}>
                                    <Award size={12} color={colors.success.primary} />
                                    <Text style={styles.bestPriceText}>Meilleur prix</Text>
                                  </RNView>
                                )}

                                <RNView style={styles.propositionHeader}>
                                  <RNView style={styles.propositionInfo}>
                                    <Text style={styles.pharmacyName}>{prop.pharmacie_nom}</Text>
                                    <RNView style={styles.locationRow}>
                                      <MapPin size={12} color={colors.text.tertiary} />
                                      <Text style={styles.locationText}>{prop.quartier}</Text>
                                      {prop.adresse && (
                                        <Text style={styles.addressText}> • {prop.adresse}</Text>
                                      )}
                                    </RNView>
                                  </RNView>
                                  <RNView style={[
                                    styles.priceBadge,
                                    isCheapest && styles.priceBadgeCheapest,
                                  ]}>
                                    <Text style={[
                                      styles.priceText,
                                      isCheapest && styles.priceTextCheapest,
                                    ]}>
                                      {prop.prix.toLocaleString()} F
                                    </Text>
                                  </RNView>
                                </RNView>

                                <RNView style={styles.propositionActions}>
                                  <Pressable
                                    onPress={() => openMaps(prop.pharmacie_nom, prop.adresse, prop.quartier)}
                                    style={({ pressed }) => [
                                      styles.actionButton,
                                      pressed && styles.actionButtonPressed,
                                    ]}
                                  >
                                    <Navigation size={16} color={colors.info.primary} />
                                    <Text style={styles.actionButtonText}>Itinéraire</Text>
                                  </Pressable>

                                  {prop.telephone && (
                                    <Pressable
                                      onPress={() => callPharmacy(prop.telephone!)}
                                      style={({ pressed }) => [
                                        styles.actionButton,
                                        styles.actionButtonCall,
                                        pressed && styles.actionButtonPressed,
                                      ]}
                                    >
                                      <Phone size={16} color={colors.success.primary} />
                                      <Text style={[styles.actionButtonText, { color: colors.success.primary }]}>
                                        Appeler
                                      </Text>
                                    </Pressable>
                                  )}
                                </RNView>
                              </RNView>
                            );
                          })}
                      </RNView>
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
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
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

  // Demande Card
  demandeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
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
  medicamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  demandeMedicament: {
    ...typography.h4,
    color: colors.text.primary,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  urgentText: {
    ...typography.caption,
    color: colors.error.primary,
    fontWeight: '600',
  },
  demandeDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  demandeDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
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
  expandIcon: {
    padding: spacing.xs,
  },

  // Propositions Preview
  propositionsPreview: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propositionsCount: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  cheapestPreview: {
    ...typography.bodySmall,
    color: colors.success.primary,
    fontWeight: '600',
  },

  // Relaunch Button
  relaunchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    borderStyle: 'dashed',
  },
  relaunchButtonPressed: {
    backgroundColor: colors.accent.ultraLight,
  },
  relaunchText: {
    ...typography.label,
    color: colors.accent.primary,
  },

  // Propositions Container
  propositionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  propositionsDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginBottom: spacing.md,
  },
  propositionsTitle: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  // Proposition Card
  propositionCard: {
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  propositionCardCheapest: {
    backgroundColor: colors.success.light,
    borderWidth: 1,
    borderColor: colors.success.primary,
  },
  bestPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  bestPriceText: {
    ...typography.caption,
    color: colors.success.primary,
    fontWeight: '700',
  },
  propositionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  propositionInfo: {
    flex: 1,
  },
  pharmacyName: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  locationText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  addressText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  priceBadge: {
    backgroundColor: colors.surface.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  priceBadgeCheapest: {
    backgroundColor: colors.success.primary,
  },
  priceText: {
    ...typography.label,
    color: colors.text.primary,
  },
  priceTextCheapest: {
    color: colors.text.inverse,
  },

  // Action Buttons
  propositionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.info.light,
    borderRadius: radius.md,
  },
  actionButtonCall: {
    backgroundColor: colors.success.light,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    ...typography.label,
    fontSize: 13,
    color: colors.info.primary,
  },
});

