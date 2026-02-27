/**
 * Dashboard Screen - Agent
 * Modern Apothecary Design System
 * Bento grid stats with premium card design
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshControl, StyleSheet, Pressable, View as RNView, Text, ScrollView, ActivityIndicator } from 'react-native';
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
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  BentoCard,
} from '../../components/design-system';

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

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }, []);

  const getStatusConfig = useCallback((status: string) => {
    switch (status) {
      case 'en_attente':
        return { color: colors.warning.primary, bgColor: colors.warning.light };
      case 'en_cours':
        return { color: colors.info.primary, bgColor: colors.info.light };
      case 'traite':
        return { color: colors.success.primary, bgColor: colors.success.light };
      default:
        return { color: colors.text.tertiary, bgColor: colors.surface.secondary };
    }
  }, []);

  const statsCards = useMemo(() => [
    { title: 'En attente', value: stats.en_attente, icon: Clock, color: colors.warning.primary, bgColor: colors.warning.light },
    { title: 'En cours', value: stats.en_cours, icon: AlertCircle, color: colors.info.primary, bgColor: colors.info.light },
    { title: 'Traités', value: stats.traite, icon: CheckCircle, color: colors.success.primary, bgColor: colors.success.light },
    { title: 'Total', value: stats.total, icon: TrendingUp, color: colors.accent.primary, bgColor: colors.accent.light },
  ], [stats]);

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <RNView style={styles.header}>
            <RNView>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>
                {profile?.full_name || 'Agent'} 🎧
              </Text>
            </RNView>
            {stats.en_attente > 0 && (
              <RNView style={styles.alertBadge}>
                <Zap size={14} color={colors.text.primary} />
                <Text style={styles.alertBadgeText}>{stats.en_attente}</Text>
              </RNView>
            )}
          </RNView>

          {loading ? (
            <RNView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent.primary} />
            </RNView>
          ) : (
            <>
              {/* Stats Grid - Bento Style */}
              <RNView style={styles.statsGrid}>
                {statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <BentoCard
                      key={stat.title}
                      size="1x1"
                      variant="elevated"
                      style={styles.statCard}
                    >
                      <RNView style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                        <Icon size={20} color={stat.color} />
                      </RNView>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statTitle}>{stat.title}</Text>
                    </BentoCard>
                  );
                })}
              </RNView>

              {/* Recent Demandes */}
              <RNView style={styles.section}>
                <RNView style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Demandes récentes</Text>
                  <RNView style={styles.liveIndicator}>
                    <RNView style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </RNView>
                </RNView>

                {recentDemandes.length === 0 ? (
                  <RNView style={styles.emptyCard}>
                    <Text style={styles.emptyEmoji}>📭</Text>
                    <Text style={styles.emptyText}>Aucune demande</Text>
                  </RNView>
                ) : (
                  <RNView style={styles.demandesList}>
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
                          <RNView style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />

                          <RNView style={styles.demandeContent}>
                            <Text style={styles.demandeMedicament} numberOfLines={1}>
                              {demande.medicament_nom}
                            </Text>
                            <RNView style={styles.demandeFooter}>
                              <RNView style={styles.clientInfo}>
                                <Users size={12} color={colors.text.tertiary} />
                                <Text style={styles.clientName}>
                                  {demande.profiles?.full_name || demande.profiles?.phone || 'Client'}
                                </Text>
                              </RNView>
                              <Text style={styles.demandeTime}>
                                {formatTime(demande.created_at)}
                              </Text>
                            </RNView>
                          </RNView>

                          <ChevronRight size={18} color={colors.text.tertiary} />
                        </Pressable>
                      );
                    })}
                  </RNView>
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
                  <ChevronRight size={18} color={colors.accent.primary} />
                </Pressable>
              </RNView>
            </>
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
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    ...typography.body,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.h1,
    color: colors.text.primary,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    ...shadows.accent,
  },
  alertBadgeText: {
    ...typography.label,
    color: colors.text.primary,
  },

  // Loading
  loadingContainer: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },

  // Stats Grid - Bento
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    minHeight: 130,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    ...typography.display,
    fontSize: 36,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statTitle: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.error.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error.primary,
  },
  liveText: {
    ...typography.overline,
    color: colors.error.primary,
  },

  // Empty
  emptyCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // Demandes list
  demandesList: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  demandeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  demandeCardPressed: {
    backgroundColor: colors.surface.secondary,
  },
  demandeCardLast: {
    borderBottomWidth: 0,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  demandeContent: {
    flex: 1,
  },
  demandeMedicament: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  demandeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clientName: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  demandeTime: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // View all button
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  viewAllButtonPressed: {
    opacity: 0.7,
  },
  viewAllText: {
    ...typography.label,
    color: colors.accent.primary,
  },
});

