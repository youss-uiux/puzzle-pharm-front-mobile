import { useEffect, useState, useRef } from 'react';
import {
  RefreshControl,
  Linking,
  StyleSheet,
  Platform,
  Pressable,
  Animated,
  Dimensions
} from 'react-native';
import { ScrollView, Spinner, View } from 'tamagui';
import { MapPin, Phone, Clock, ArrowRight, Pill, Zap } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { supabase, PharmacieGarde } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<PharmacieGarde[]>([]);
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
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient
        colors={['#0A1628', '#132F4C', '#0A1628']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative elements */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
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
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {profile?.full_name || 'Bienvenue'} 👋
            </Text>
          </Animated.View>

          {/* Search Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }]
            }}
          >
            <Pressable
              onPress={() => router.push('/(client)/search')}
              style={({ pressed }) => [
                styles.searchCard,
                pressed && styles.searchCardPressed
              ]}
            >
              <LinearGradient
                colors={['#00D9FF', '#0EA5E9', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchCardGradient}
              >
                <View style={styles.searchCardContent}>
                  <View style={styles.searchIconContainer}>
                    <Pill size={28} color="#0A1628" />
                  </View>
                  <View style={styles.searchTextContainer}>
                    <Text style={styles.searchTitle}>Chercher un médicament</Text>
                    <Text style={styles.searchSubtitle}>
                      Trouvez rapidement dans les pharmacies
                    </Text>
                  </View>
                  <View style={styles.searchArrow}>
                    <ArrowRight size={24} color="#0A1628" />
                  </View>
                </View>

                {/* Decorative dots */}
                <View style={styles.searchDots}>
                  {[...Array(6)].map((_, i) => (
                    <View key={i} style={styles.searchDot} />
                  ))}
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Section Pharmacies de garde */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.5) }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.sectionIcon}
                >
                  <Clock size={14} color="#FFFFFF" />
                </LinearGradient>
                <View>
                  <Text style={styles.sectionTitle}>Pharmacies de garde</Text>
                  <Text style={styles.sectionDate}>
                    {new Date().toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Spinner size="large" color="#00D9FF" />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : pharmacies.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🏥</Text>
                <Text style={styles.emptyTitle}>Aucune pharmacie</Text>
                <Text style={styles.emptyText}>
                  Aucune pharmacie de garde trouvée pour aujourd'hui
                </Text>
              </View>
            ) : (
              <View style={styles.pharmaciesList}>
                {pharmacies.map((pharmacie, index) => {
                  const isLast = index === pharmacies.length - 1;

                  return (
                    <Animated.View
                      key={pharmacie.id}
                      style={[
                        styles.pharmacieCard,
                        isLast && styles.pharmacieCardLast,
                        {
                          opacity: fadeAnim,
                          transform: [{
                            translateY: Animated.multiply(
                              slideAnim,
                              1.5 + index * 0.2
                            )
                          }]
                        }
                      ]}
                    >
                      <View style={styles.pharmacieContent}>
                        <View style={styles.pharmacieHeader}>
                          <View style={styles.pharmacieIndex}>
                            <Text style={styles.pharmacieIndexText}>
                              {String(index + 1).padStart(2, '0')}
                            </Text>
                          </View>
                          <View style={styles.pharmacieInfo}>
                            <Text style={styles.pharmacieName}>{pharmacie.nom}</Text>
                            <View style={styles.pharmacieAddress}>
                              <MapPin size={12} color="rgba(255,255,255,0.4)" />
                              <Text style={styles.pharmacieAddressText} numberOfLines={1}>
                                {pharmacie.adresse}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.pharmacieFooter}>
                          <View style={styles.pharmacieQuartier}>
                            <Text style={styles.pharmacieQuartierText}>
                              {pharmacie.quartier}
                            </Text>
                          </View>

                          <Pressable
                            onPress={() => callPharmacy(pharmacie.telephone)}
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
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          <View style={{ height: 100 }} />
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

  // Decorative
  decorCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 217, 255, 0.03)',
    top: -50,
    right: -80,
  },
  decorCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    bottom: 200,
    left: -60,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
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

  // Search Card
  searchCard: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#00D9FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  searchCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  searchCardGradient: {
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  searchCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 22, 40, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A1628',
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 13,
    color: 'rgba(10, 22, 40, 0.6)',
    fontWeight: '500',
  },
  searchArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 22, 40, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchDots: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
  },
  searchDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(10, 22, 40, 0.2)',
  },

  // Section
  section: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    textTransform: 'capitalize',
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

  // Loading
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },

  // Empty state
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
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  // Pharmacies list
  pharmaciesList: {
    gap: 12,
  },
  pharmacieCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  pharmacieCardLast: {
    marginBottom: 0,
  },
  pharmacieContent: {
    padding: 18,
  },
  pharmacieHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pharmacieIndex: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  pharmacieIndexText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00D9FF',
  },
  pharmacieInfo: {
    flex: 1,
  },
  pharmacieName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  pharmacieAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pharmacieAddressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    flex: 1,
  },
  pharmacieFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pharmacieQuartier: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pharmacieQuartierText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D9FF',
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
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
