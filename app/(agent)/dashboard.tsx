import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshControl, StyleSheet, Platform, Pressable, Animated } from 'react-native';
import { ScrollView, Spinner, View } from 'tamagui';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  ChevronRight,
  Zap
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Stats = {
  total: number;
  en_attente: number;
  en_cours: number;
  traite: number;
};

export default function DashboardScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    en_attente: 0,
    en_cours: 0,
    traite: 0,
  });
  const [recentDemandes, setRecentDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchData = useCallback(async () => {
    try {
      const { data: allDemandes, error: statsError } = await supabase
        .from('demandes')
        .select('status');

      if (statsError) throw statsError;

      const statsData = {
        total: allDemandes?.length || 0,
        en_attente: allDemandes?.filter((d: any) => d.status === 'en_attente').length || 0,
        en_cours: allDemandes?.filter((d: any) => d.status === 'en_cours').length || 0,
        traite: allDemandes?.filter((d: any) => d.status === 'traite').length || 0,
      };
      setStats(statsData);

      const { data: recent, error: recentError } = await supabase
        .from('demandes')
        .select(`
          *,
          profiles:client_id (phone, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentDemandes(recent || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('agent-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demandes',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const formatTime = (dateString: string) => {
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'en_attente':
        return { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' };
      case 'en_cours':
        return { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)' };
      case 'traite':
        return { color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' };
      default:
        return { color: 'rgba(255,255,255,0.5)', bgColor: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  const statsCards = [
    { title: 'En attente', value: stats.en_attente, icon: Clock, color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
    { title: 'En cours', value: stats.en_cours, icon: AlertCircle, color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] },
    { title: 'Traités', value: stats.traite, icon: CheckCircle, color: '#10B981', gradient: ['#10B981', '#059669'] },
    { title: 'Total', value: stats.total, icon: TrendingUp, color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0A1628', '#132F4C', '#0A1628']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10B981"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>
                {profile?.full_name || 'Agent'} 🎧
              </Text>
            </View>
            {stats.en_attente > 0 && (
              <View style={styles.alertBadge}>
                <Zap size={14} color="#0A1628" />
                <Text style={styles.alertBadgeText}>{stats.en_attente}</Text>
              </View>
            )}
          </Animated.View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Spinner size="large" color="#10B981" />
            </View>
          ) : (
            <>
              {/* Stats Grid */}
              <Animated.View
                style={[
                  styles.statsGrid,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }]
                  }
                ]}
              >
                {statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <View key={stat.title} style={styles.statCard}>
                      <View style={styles.statHeader}>
                        <LinearGradient
                          colors={stat.gradient as [string, string]}
                          style={styles.statIcon}
                        >
                          <Icon size={18} color="#FFFFFF" />
                        </LinearGradient>
                      </View>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statTitle}>{stat.title}</Text>
                    </View>
                  );
                })}
              </Animated.View>

              {/* Recent Demandes */}
              <Animated.View
                style={[
                  styles.section,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.4) }]
                  }
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Demandes récentes</Text>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>

                {recentDemandes.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyEmoji}>📭</Text>
                    <Text style={styles.emptyText}>Aucune demande</Text>
                  </View>
                ) : (
                  <View style={styles.demandesList}>
                    {recentDemandes.map((demande, index) => {
                      const statusConfig = getStatusConfig(demande.status);
                      const isLast = index === recentDemandes.length - 1;

                      return (
                        <Pressable
                          key={demande.id}
                          onPress={() => router.push('/(agent)/demandes')}
                          style={({ pressed }) => [
                            styles.demandeCard,
                            pressed && styles.demandeCardPressed,
                            isLast && styles.demandeCardLast,
                          ]}
                        >
                          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />

                          <View style={styles.demandeContent}>
                            <Text style={styles.demandeMedicament} numberOfLines={1}>
                              {demande.medicament_nom}
                            </Text>
                            <View style={styles.demandeFooter}>
                              <View style={styles.clientInfo}>
                                <Users size={12} color="rgba(255,255,255,0.4)" />
                                <Text style={styles.clientName}>
                                  {demande.profiles?.full_name || demande.profiles?.phone || 'Client'}
                                </Text>
                              </View>
                              <Text style={styles.demandeTime}>
                                {formatTime(demande.created_at)}
                              </Text>
                            </View>
                          </View>

                          <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {/* View All Button */}
                <Pressable
                  onPress={() => router.push('/(agent)/demandes')}
                  style={({ pressed }) => [
                    styles.viewAllButton,
                    pressed && styles.viewAllButtonPressed
                  ]}
                >
                  <Text style={styles.viewAllText}>Voir toutes les demandes</Text>
                  <ChevronRight size={18} color="#10B981" />
                </Pressable>
              </Animated.View>
            </>
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
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    top: -80,
    right: -80,
  },
  decorCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
    bottom: 200,
    left: -60,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  alertBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A1628',
  },

  // Loading
  loadingContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statHeader: {
    marginBottom: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },

  // Section
  section: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1,
  },

  // Empty
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },

  // Demandes list
  demandesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  demandeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  demandeCardPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  demandeCardLast: {
    borderBottomWidth: 0,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  demandeContent: {
    flex: 1,
  },
  demandeMedicament: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  demandeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clientName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  demandeTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },

  // View all button
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    gap: 4,
  },
  viewAllButtonPressed: {
    opacity: 0.7,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
});

