import { useEffect, useState } from 'react';
import { RefreshControl, Linking } from 'react-native';
import {
  YStack,
  XStack,
  Text,
  H2,
  H4,
  ScrollView,
  Card,
  Button,
  Spinner
} from 'tamagui';
import { MapPin, Phone, Clock, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase, PharmacieGarde } from '../../lib/supabase';
import { useAuth } from '../_layout';

export default function HomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<PharmacieGarde[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView
        flex={1}
        backgroundColor="#F1F5F9"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <YStack padding="$4" paddingTop="$2">
          <Text color="#64748B" fontSize={16}>
            {getGreeting()},
          </Text>
          <H2 color="#1E293B">
            {profile?.full_name || 'Bienvenue'} 👋
          </H2>
        </YStack>

        {/* Carte de recherche rapide */}
        <YStack paddingHorizontal="$4" marginBottom="$4">
          <Card
            backgroundColor="#2563EB"
            padding="$4"
            borderRadius="$4"
            pressStyle={{ scale: 0.98, opacity: 0.9 }}
            onPress={() => router.push('/(client)/search')}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1}>
                <Text color="white" fontWeight="700" fontSize={18} marginBottom={4}>
                  Chercher un médicament
                </Text>
                <Text color="rgba(255,255,255,0.8)" fontSize={14}>
                  Trouvez votre médicament dans les pharmacies proches
                </Text>
              </YStack>
              <YStack
                backgroundColor="rgba(255,255,255,0.2)"
                padding="$2"
                borderRadius="$3"
              >
                <ChevronRight size={24} color="white" />
              </YStack>
            </XStack>
          </Card>
        </YStack>

        {/* Section Pharmacies de garde */}
        <YStack paddingHorizontal="$4">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
            <XStack gap="$2" alignItems="center">
              <YStack
                backgroundColor="#10B981"
                padding={6}
                borderRadius={8}
              >
                <Clock size={16} color="white" />
              </YStack>
              <H4 color="#1E293B">Pharmacies de garde</H4>
            </XStack>
            <Text color="#64748B" fontSize={12}>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </Text>
          </XStack>

          {loading ? (
            <YStack alignItems="center" padding="$8">
              <Spinner size="large" color="#2563EB" />
              <Text color="#64748B" marginTop="$2">
                Chargement des pharmacies...
              </Text>
            </YStack>
          ) : pharmacies.length === 0 ? (
            <Card
              padding="$4"
              backgroundColor="#E2E8F0"
              borderRadius={12}
            >
              <YStack alignItems="center">
                <Text fontSize={40} marginBottom="$2">🏥</Text>
                <Text color="#64748B" textAlign="center">
                  Aucune pharmacie de garde trouvée pour aujourd'hui
                </Text>
              </YStack>
            </Card>
          ) : (
            <YStack gap="$3" paddingBottom="$4">
              {pharmacies.map((pharmacie) => (
                <Card
                  key={pharmacie.id}
                  padding="$4"
                  borderRadius={12}
                  backgroundColor="#FFFFFF"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  shadowColor="#000"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.05}
                  shadowRadius={4}
                >
                  <XStack justifyContent="space-between" alignItems="flex-start">
                    <YStack flex={1} marginRight="$3">
                      <Text fontWeight="700" fontSize={16} color="#1E293B" marginBottom={6}>
                        {pharmacie.nom}
                      </Text>

                      <XStack gap="$2" alignItems="center" marginBottom={6}>
                        <MapPin size={14} color="#64748B" />
                        <Text color="#64748B" fontSize={14} numberOfLines={1} flex={1}>
                          {pharmacie.adresse}
                        </Text>
                      </XStack>

                      <YStack
                        backgroundColor="#DBEAFE"
                        alignSelf="flex-start"
                        paddingHorizontal={10}
                        paddingVertical={4}
                        borderRadius={6}
                      >
                        <Text color="#2563EB" fontSize={12} fontWeight="600">
                          {pharmacie.quartier}
                        </Text>
                      </YStack>
                    </YStack>

                    <Button
                      size="$4"
                      backgroundColor="#10B981"
                      borderRadius={50}
                      width={48}
                      height={48}
                      onPress={() => callPharmacy(pharmacie.telephone)}
                      pressStyle={{ opacity: 0.8 }}
                    >
                      <Phone size={20} color="white" />
                    </Button>
                  </XStack>
                </Card>
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
