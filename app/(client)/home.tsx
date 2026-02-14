/**
 * Home Screen - Client
 * Modern Apothecary Design System
 * Bento Grid Layout with active requests banner
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  RefreshControl,
  Linking,
  StyleSheet,
  Pressable,
  Animated,
  View as RNView,
  Text,
  TextInput,
} from 'react-native';
import { ScrollView, Spinner } from 'tamagui';
import * as Haptics from 'expo-haptics';
import {
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Pill,
  Search,
  FileText,
  Navigation,
  AlertCircle,
  Filter
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { supabase, PharmacieGarde } from '../../lib/supabase';
import { useAuth } from '../_layout';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  BackgroundShapes,
  BentoCard,
  SkeletonList,
  EmptyState,
} from '../../components/design-system';

export default function HomeScreen() {
  const { profile, session } = useAuth();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<PharmacieGarde[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<PharmacieGarde[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quartierFilter, setQuartierFilter] = useState('');
  const [activeDemandesCount, setActiveDemandesCount] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;

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

  // Animate banner when count changes
  useEffect(() => {
    if (activeDemandesCount > 0) {
      Animated.spring(bannerAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [activeDemandesCount]);

  const fetchPharmaciesGarde = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('pharmacies_garde')
        .select('*')
        .lte('date_debut', today)
        .gte('date_fin', today)
        .order('quartier');

      if (error) throw error;
      setPharmacies(data || []);
      setFilteredPharmacies(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des pharmacies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchActiveDemandesCount = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { count, error } = await supabase
        .from('demandes')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', session.user.id)
        .in('status', ['en_attente', 'en_cours']);

      if (!error && count !== null) {
        setActiveDemandesCount(count);
      }
    } catch (error) {
      console.error('Error fetching active demandes:', error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchPharmaciesGarde();
    fetchActiveDemandesCount();
  }, [fetchPharmaciesGarde, fetchActiveDemandesCount]);

  // Filter pharmacies by quartier
  useEffect(() => {
    if (!quartierFilter.trim()) {
      setFilteredPharmacies(pharmacies);
    } else {
      const filtered = pharmacies.filter(p =>
        p.quartier.toLowerCase().includes(quartierFilter.toLowerCase()) ||
        p.nom.toLowerCase().includes(quartierFilter.toLowerCase())
      );
      setFilteredPharmacies(filtered);
    }
  }, [quartierFilter, pharmacies]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchPharmaciesGarde();
    fetchActiveDemandesCount();
  };

  const callPharmacy = (telephone: string) => {
    Linking.openURL(`tel:${telephone}`);
  };

  const openMaps = (pharmacyName: string, quartier: string) => {
    const query = `${pharmacyName} ${quartier}`;
    const url = `https://maps.google.com/?q=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // Get unique quartiers for filter suggestions
  const uniqueQuartiers = [...new Set(pharmacies.map(p => p.quartier))];

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundShapes variant="home" />

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
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {profile?.full_name || 'Bienvenue'} 👋
            </Text>
          </Animated.View>

          {/* Active Requests Banner */}
          {activeDemandesCount > 0 && (
            <Animated.View
              style={{
                opacity: bannerAnim,
                transform: [{
                  translateY: bannerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  })
                }],
              }}
            >
              <Pressable
                onPress={() => router.push('/(client)/history')}
                style={({ pressed }) => [
                  styles.activeBanner,
                  pressed && styles.activeBannerPressed,
                ]}
              >
                <RNView style={styles.activeBannerIcon}>
                  <AlertCircle size={20} color={colors.info.primary} />
                </RNView>
                <RNView style={styles.activeBannerContent}>
                  <Text style={styles.activeBannerTitle}>
                    {activeDemandesCount} demande{activeDemandesCount > 1 ? 's' : ''} en cours
                  </Text>
                  <Text style={styles.activeBannerSubtitle}>
                    Tap pour voir le statut
                  </Text>
                </RNView>
                <ArrowRight size={18} color={colors.info.primary} />
              </Pressable>
            </Animated.View>
          )}

          {/* Hero Search Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 1.1) }],
            }}
          >
            <BentoCard
              size="2x1"
              variant="filled"
              onPress={() => router.push('/(client)/search')}
              style={styles.searchCard}
            >
              <RNView style={styles.searchCardContent}>
                <RNView style={styles.searchIconWrapper}>
                  <Search size={28} color={colors.text.primary} strokeWidth={2.5} />
                </RNView>
                <RNView style={styles.searchTextWrapper}>
                  <Text style={styles.searchTitle}>Chercher un médicament</Text>
                  <Text style={styles.searchSubtitle}>
                    Trouvez rapidement dans les pharmacies
                  </Text>
                </RNView>
                <RNView style={styles.searchArrowWrapper}>
                  <ArrowRight size={24} color={colors.text.primary} />
                </RNView>
              </RNView>
            </BentoCard>
          </Animated.View>

          {/* Bento Grid - Quick Actions */}
          <Animated.View
            style={[
              styles.bentoGrid,
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }],
              },
            ]}
          >
            <BentoCard
              size="1x1"
              variant="elevated"
              onPress={() => router.push('/(client)/search')}
              style={styles.bentoItem}
            >
              <RNView style={[styles.bentoIcon, { backgroundColor: colors.accent.light }]}>
                <Pill size={24} color={colors.accent.primary} />
              </RNView>
              <Text style={styles.bentoTitle}>Médicaments</Text>
              <Text style={styles.bentoDescription}>Recherche rapide</Text>
            </BentoCard>

            <BentoCard
              size="1x1"
              variant="elevated"
              onPress={() => router.push('/(client)/history')}
              style={styles.bentoItem}
            >
              <RNView style={[styles.bentoIcon, { backgroundColor: colors.info.light }]}>
                <FileText size={24} color={colors.info.primary} />
              </RNView>
              <RNView style={styles.bentoTitleRow}>
                <Text style={styles.bentoTitle}>Mes demandes</Text>
                {activeDemandesCount > 0 && (
                  <RNView style={styles.bentoBadge}>
                    <Text style={styles.bentoBadgeText}>{activeDemandesCount}</Text>
                  </RNView>
                )}
              </RNView>
              <Text style={styles.bentoDescription}>Historique</Text>
            </BentoCard>
          </Animated.View>

          {/* Pharmacies de Garde Section */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.3) }],
              },
            ]}
          >
            <RNView style={styles.sectionHeader}>
              <RNView>
                <Text style={styles.sectionTitle}>Pharmacies de garde</Text>
                <Text style={styles.sectionSubtitle}>
                  Ouvertes 24h/24 aujourd'hui
                </Text>
              </RNView>
              <RNView style={styles.pharmacyCount}>
                <Text style={styles.pharmacyCountText}>{pharmacies.length}</Text>
              </RNView>
            </RNView>

            {/* Quartier Filter */}
            {pharmacies.length > 3 && (
              <RNView style={styles.filterContainer}>
                <RNView style={styles.filterInput}>
                  <Filter size={16} color={colors.text.tertiary} />
                  <TextInput
                    style={styles.filterTextInput}
                    placeholder="Filtrer par quartier..."
                    placeholderTextColor={colors.text.tertiary}
                    value={quartierFilter}
                    onChangeText={setQuartierFilter}
                    selectionColor={colors.accent.primary}
                  />
                </RNView>
              </RNView>
            )}

            {/* Pharmacies List */}
            {loading ? (
              <SkeletonList count={2} />
            ) : filteredPharmacies.length === 0 ? (
              <EmptyState
                variant="pharmacies"
                title={quartierFilter ? 'Aucune pharmacie trouvée' : undefined}
                description={quartierFilter ? `Aucune pharmacie de garde dans "${quartierFilter}"` : undefined}
              />
            ) : (
              <RNView style={styles.pharmaciesList}>
                {filteredPharmacies.map((pharmacy) => (
                  <RNView key={pharmacy.id} style={styles.pharmacieCard}>
                    <RNView style={styles.pharmacieHeader}>
                      <RNView style={styles.pharmacieInfo}>
                        <Text style={styles.pharmacieName}>{pharmacy.nom}</Text>
                        <RNView style={styles.pharmacieLocation}>
                          <MapPin size={14} color={colors.text.tertiary} />
                          <Text style={styles.pharmacieQuartier}>{pharmacy.quartier}</Text>
                        </RNView>
                      </RNView>
                      <RNView style={styles.pharmacieHours}>
                        <Clock size={14} color={colors.success.primary} />
                        <Text style={styles.pharmacieHoursText}>24h</Text>
                      </RNView>
                    </RNView>

                    <RNView style={styles.pharmacieActions}>
                      <Pressable
                        onPress={() => openMaps(pharmacy.nom, pharmacy.quartier)}
                        style={({ pressed }) => [
                          styles.pharmacieAction,
                          pressed && styles.pharmacieActionPressed,
                        ]}
                        accessibilityLabel="Voir sur la carte"
                        accessibilityRole="button"
                      >
                        <Navigation size={16} color={colors.info.primary} />
                        <Text style={styles.pharmacieActionText}>Carte</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => callPharmacy(pharmacy.telephone)}
                        style={({ pressed }) => [
                          styles.pharmacieAction,
                          styles.pharmacieActionCall,
                          pressed && styles.pharmacieActionPressed,
                        ]}
                        accessibilityLabel={`Appeler ${pharmacy.nom}`}
                        accessibilityRole="button"
                      >
                        <Phone size={16} color={colors.success.primary} />
                        <Text style={[styles.pharmacieActionText, { color: colors.success.primary }]}>
                          Appeler
                        </Text>
                      </Pressable>
                    </RNView>
                  </RNView>
                ))}
              </RNView>
            )}
          </Animated.View>

          {/* Spacer for tab bar */}
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
  greeting: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.h1,
    color: colors.text.primary,
  },

  // Active Banner
  activeBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.info.light,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.info.primary,
  },
  activeBannerPressed: {
    opacity: 0.8,
  },
  activeBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activeBannerContent: {
    flex: 1,
  },
  activeBannerTitle: {
    ...typography.label,
    color: colors.info.primary,
  },
  activeBannerSubtitle: {
    ...typography.caption,
    color: colors.info.secondary,
  },

  // Search Card
  searchCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(26, 26, 26, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchTextWrapper: {
    flex: 1,
    marginLeft: spacing.md,
  },
  searchTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  searchSubtitle: {
    ...typography.bodySmall,
    color: colors.text.primary,
    opacity: 0.7,
  },
  searchArrowWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  bentoItem: {
    flex: 1,
  },
  bentoIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bentoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bentoTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  bentoBadge: {
    backgroundColor: colors.error.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  bentoBadgeText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '700',
    fontSize: 11,
  },
  bentoDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  pharmacyCount: {
    backgroundColor: colors.accent.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  pharmacyCountText: {
    ...typography.label,
    color: colors.accent.primary,
    fontSize: 13,
  },

  // Filter
  filterContainer: {
    marginBottom: spacing.md,
  },
  filterInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterTextInput: {
    flex: 1,
    height: 44,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
  },

  // Pharmacies list
  pharmaciesList: {
    gap: spacing.md,
  },
  pharmacieCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  pharmacieHeader: {
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pharmacieInfo: {
    flex: 1,
  },
  pharmacieName: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  pharmacieLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pharmacieQuartier: {
    ...typography.body,
    color: colors.text.secondary,
  },
  pharmacieHours: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  pharmacieHoursText: {
    ...typography.caption,
    color: colors.success.primary,
    fontWeight: '600',
  },
  pharmacieActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  pharmacieAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.info.light,
  },
  pharmacieActionCall: {
    backgroundColor: colors.success.light,
    borderLeftWidth: 1,
    borderLeftColor: colors.border.light,
  },
  pharmacieActionPressed: {
    opacity: 0.7,
  },
  pharmacieActionText: {
    ...typography.label,
    color: colors.info.primary,
    fontSize: 13,
  },
});
