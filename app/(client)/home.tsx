/**
 * Home Screen - Client
 * Modern Apothecary Design System
 * Bento Grid Layout with Search Bar prioritized
 */
import { useEffect, useState, useRef } from 'react';
import {
  RefreshControl,
  Linking,
  StyleSheet,
  Platform,
  Pressable,
  Animated,
  Dimensions,
  View as RNView,
  Text,
} from 'react-native';
import { ScrollView, Spinner, View } from 'tamagui';
import { MapPin, Phone, Clock, ArrowRight, Pill, Search, Grid3X3, Sparkles } from 'lucide-react-native';
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
} from '../../components/design-system';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<PharmacieGarde[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchPharmaciesGarde = async () => {
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
    } catch (error) {
      console.error('Erreur lors du chargement des pharmacies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPharmaciesGarde();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPharmaciesGarde();
  };

  const callPharmacy = (telephone: string) => {
    Linking.openURL(`tel:${telephone}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />

      {/* Minimal Background */}
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

          {/* Hero Search Card - Full Width Bento */}
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
                <Grid3X3 size={24} color={colors.info.primary} />
              </RNView>
              <Text style={styles.bentoTitle}>Catégories</Text>
              <Text style={styles.bentoDescription}>Explorer par type</Text>
            </BentoCard>
          </Animated.View>

          {/* Section Pharmacies de garde */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.4) }],
              },
            ]}
          >
            <RNView style={styles.sectionHeader}>
              <RNView style={styles.sectionTitleContainer}>
                <RNView style={styles.sectionIcon}>
                  <Clock size={16} color={colors.success.primary} />
                </RNView>
                <RNView>
                  <Text style={styles.sectionTitle}>Pharmacies de garde</Text>
                  <Text style={styles.sectionDate}>
                    {new Date().toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                </RNView>
              </RNView>
              <RNView style={styles.liveIndicator}>
                <RNView style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </RNView>
            </RNView>

            {loading ? (
              <RNView style={styles.loadingContainer}>
                <Spinner size="large" color={colors.accent.primary} />
                <Text style={styles.loadingText}>Chargement...</Text>
              </RNView>
            ) : pharmacies.length === 0 ? (
              <RNView style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🏥</Text>
                <Text style={styles.emptyTitle}>Aucune pharmacie</Text>
                <Text style={styles.emptyText}>
                  Aucune pharmacie de garde trouvée pour aujourd'hui
                </Text>
              </RNView>
            ) : (
              <RNView style={styles.pharmaciesList}>
                {pharmacies.map((pharmacie, index) => {
                  const isLast = index === pharmacies.length - 1;

                  return (
                    <PharmacyCard
                      key={pharmacie.id}
                      pharmacie={pharmacie}
                      index={index}
                      isLast={isLast}
                      onCall={callPharmacy}
                      fadeAnim={fadeAnim}
                      slideAnim={slideAnim}
                    />
                  );
                })}
              </RNView>
            )}
          </Animated.View>

          <RNView style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </RNView>
  );
}

// Pharmacy Card Component
interface PharmacyCardProps {
  pharmacie: PharmacieGarde;
  index: number;
  isLast: boolean;
  onCall: (telephone: string) => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

const PharmacyCard: React.FC<PharmacyCardProps> = ({
  pharmacie,
  index,
  isLast,
  onCall,
  fadeAnim,
  slideAnim,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      damping: 15,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.pharmacieCard,
        isLast && styles.pharmacieCardLast,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: Animated.multiply(slideAnim, 1.5 + index * 0.15),
            },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <RNView style={styles.pharmacieContent}>
        <RNView style={styles.pharmacieHeader}>
          <RNView style={styles.pharmacieIndex}>
            <Text style={styles.pharmacieIndexText}>
              {String(index + 1).padStart(2, '0')}
            </Text>
          </RNView>
          <RNView style={styles.pharmacieInfo}>
            <Text style={styles.pharmacieName}>{pharmacie.nom}</Text>
            <RNView style={styles.pharmacieAddress}>
              <MapPin size={12} color={colors.text.tertiary} />
              <Text style={styles.pharmacieAddressText} numberOfLines={1}>
                {pharmacie.adresse}
              </Text>
            </RNView>
          </RNView>
        </RNView>

        <RNView style={styles.pharmacieFooter}>
          <RNView style={styles.pharmacieQuartier}>
            <Text style={styles.pharmacieQuartierText}>{pharmacie.quartier}</Text>
          </RNView>

          <Pressable
            onPress={() => onCall(pharmacie.telephone)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.callButton}
          >
            <RNView style={styles.callButtonInner}>
              <Phone size={18} color={colors.text.primary} />
            </RNView>
          </Pressable>
        </RNView>
      </RNView>
    </Animated.View>
  );
};

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
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.h1,
    color: colors.text.primary,
  },

  // Search Card
  searchCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.accent.primary,
    ...shadows.accent,
  },
  searchCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(26, 26, 26, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  searchTextWrapper: {
    flex: 1,
  },
  searchTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  searchSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(26, 26, 26, 0.6)',
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
    marginBottom: spacing.xl,
  },
  bentoItem: {
    flex: 1,
    minHeight: 140,
  },
  bentoIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bentoTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  bentoDescription: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.success.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  sectionDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    textTransform: 'capitalize',
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

  // Loading
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.text.tertiary,
  },

  // Empty state
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
  emptyTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
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
  pharmacieCardLast: {
    marginBottom: 0,
  },
  pharmacieContent: {
    padding: spacing.lg,
  },
  pharmacieHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  pharmacieIndex: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pharmacieIndexText: {
    ...typography.label,
    color: colors.accent.primary,
  },
  pharmacieInfo: {
    flex: 1,
  },
  pharmacieName: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  pharmacieAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pharmacieAddressText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    flex: 1,
  },
  pharmacieFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pharmacieQuartier: {
    backgroundColor: colors.accent.ultraLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  pharmacieQuartierText: {
    ...typography.caption,
    color: colors.accent.secondary,
    fontWeight: '600',
  },
  callButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
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
