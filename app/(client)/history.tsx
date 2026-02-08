import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshControl, Linking, StyleSheet, Platform, Pressable, Animated } from 'react-native';
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
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
        return { label: 'En attente', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)', icon: Clock };
      case 'en_cours':
        return { label: 'En cours', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)', icon: AlertCircle };
      case 'traite':
        return { label: 'Traité', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle };
      default:
        return { label: status, color: 'rgba(255,255,255,0.5)', bgColor: 'rgba(255, 255, 255, 0.05)', icon: Clock };
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
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0A1628', '#132F4C', '#0A1628']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00D9FF"
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
            <View style={styles.loadingContainer}>
              <Spinner size="large" color="#00D9FF" />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
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
              <View style={styles.emptyIcon}>
                <FileText size={48} color="rgba(255,255,255,0.3)" />
              </View>
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
                  <View key={demande.id} style={styles.demandeCard}>
                    {/* Header */}
                    <View style={styles.demandeHeader}>
                      <View style={styles.demandeInfo}>
                        <Text style={styles.demandeMedicament}>{demande.medicament_nom}</Text>
                        {demande.description && (
                          <Text style={styles.demandeDescription} numberOfLines={2}>
                            {demande.description}
                          </Text>
                        )}
                        <Text style={styles.demandeDate}>{formatDate(demande.created_at)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        <StatusIcon size={12} color={statusConfig.color} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>

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
                            <ChevronUp size={20} color="#00D9FF" />
                          ) : (
                            <ChevronDown size={20} color="#00D9FF" />
                          )}
                        </Pressable>

                        {isExpanded && (
                          <View style={styles.propositionsList}>
                            {demande.propositions.map((proposition) => (
                              <View key={proposition.id} style={styles.propositionCard}>
                                <View style={styles.propositionInfo}>
                                  <Text style={styles.propositionName}>{proposition.pharmacie_nom}</Text>
                                  <View style={styles.propositionLocation}>
                                    <MapPin size={12} color="rgba(255,255,255,0.4)" />
                                    <Text style={styles.propositionAddress}>
                                      {proposition.quartier}
                                      {proposition.adresse && ` - ${proposition.adresse}`}
                                    </Text>
                                  </View>
                                  <View style={styles.priceBadge}>
                                    <Text style={styles.priceText}>
                                      {proposition.prix.toLocaleString()} FCFA
                                    </Text>
                                  </View>
                                </View>

                                {proposition.telephone && (
                                  <Pressable
                                    onPress={() => callPharmacy(proposition.telephone!)}
                                    style={({ pressed }) => [
                                      styles.callButton,
                                      pressed && styles.callButtonPressed
                                    ]}
                                  >
                                    <LinearGradient
                                      colors={['#10B981', '#059669']}
                                      style={styles.callButtonGradient}
                                    >
                                      <Phone size={18} color="#FFFFFF" />
                                    </LinearGradient>
                                  </Pressable>
                                )}
                              </View>
                            ))}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Decorative
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 217, 255, 0.03)',
    top: -50,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    bottom: 300,
    left: -40,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },

  // Loading
  loadingContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },

  // Empty
  emptyCard: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  // Demande Card
  demandeCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  demandeHeader: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  demandeInfo: {
    flex: 1,
    marginRight: 12,
  },
  demandeMedicament: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  demandeDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  demandeDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Propositions
  propositionsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  propositionsTogglePressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  propositionsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D9FF',
  },
  propositionsList: {
    padding: 12,
    paddingTop: 0,
    gap: 10,
  },
  propositionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  propositionInfo: {
    flex: 1,
    marginRight: 12,
  },
  propositionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  propositionLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  propositionAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    flex: 1,
  },
  priceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  callButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  callButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  callButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

