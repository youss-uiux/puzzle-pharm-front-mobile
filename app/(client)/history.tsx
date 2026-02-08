import { useEffect, useState, useCallback } from 'react';
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
  Spinner,
  Separator
} from 'tamagui';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, Demande, Proposition } from '../../lib/supabase';
import { useAuth } from '../_layout';

type DemandeWithPropositions = Demande & {
  propositions: Proposition[];
};

export default function HistoryScreen() {
  const { session } = useAuth();
  const [demandes, setDemandes] = useState<DemandeWithPropositions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDemande, setExpandedDemande] = useState<string | null>(null);

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
        return {
          label: 'En attente',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          icon: Clock,
        };
      case 'en_cours':
        return {
          label: 'En cours',
          color: '#3B82F6',
          bgColor: '#DBEAFE',
          icon: AlertCircle,
        };
      case 'traite':
        return {
          label: 'Traité',
          color: '#10B981',
          bgColor: '#D1FAE5',
          icon: CheckCircle,
        };
      default:
        return {
          label: status,
          color: '#64748B',
          bgColor: '#F1F5F9',
          icon: Clock,
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView
        flex={1}
        backgroundColor="#F1F5F9"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <YStack padding="$4" paddingBottom="$2">
          <H2 color="#1E293B">Mes demandes</H2>
          <Text color="#64748B" fontSize={14}>
            Suivez l'état de vos recherches de médicaments
          </Text>
        </YStack>

        {/* Liste des demandes */}
        <YStack padding="$4" paddingTop="$2" gap="$3">
          {loading ? (
            <YStack alignItems="center" padding="$8">
              <Spinner size="large" color="#2563EB" />
              <Text color="#64748B" marginTop="$2">
                Chargement...
              </Text>
            </YStack>
          ) : demandes.length === 0 ? (
            <Card
              padding="$6"
              backgroundColor="#FFFFFF"
              borderRadius={16}
              borderWidth={1}
              borderColor="#E2E8F0"
            >
              <YStack alignItems="center">
                <Text fontSize={48} marginBottom="$3">📋</Text>
                <H4 color="#1E293B" textAlign="center" marginBottom="$2">
                  Aucune demande
                </H4>
                <Text color="#64748B" textAlign="center">
                  Vous n'avez pas encore effectué de recherche de médicament.
                </Text>
              </YStack>
            </Card>
          ) : (
            demandes.map((demande) => {
              const statusConfig = getStatusConfig(demande.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedDemande === demande.id;
              const hasPropositions = demande.propositions && demande.propositions.length > 0;

              return (
                <Card
                  key={demande.id}
                  borderRadius={16}
                  backgroundColor="#FFFFFF"
                  overflow="hidden"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                >
                  {/* En-tête de la demande */}
                  <YStack padding="$4">
                    <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$2">
                      <YStack flex={1} marginRight="$2">
                        <Text fontWeight="700" fontSize={17} color="#1E293B">
                          {demande.medicament_nom}
                        </Text>
                        {demande.description && (
                          <Text color="#64748B" fontSize={13} marginTop={4} numberOfLines={2}>
                            {demande.description}
                          </Text>
                        )}
                      </YStack>

                      <XStack
                        backgroundColor={statusConfig.bgColor}
                        paddingHorizontal={10}
                        paddingVertical={4}
                        borderRadius={8}
                        alignItems="center"
                        gap="$1"
                      >
                        <StatusIcon size={14} color={statusConfig.color} />
                        <Text color={statusConfig.color} fontSize={12} fontWeight="600">
                          {statusConfig.label}
                        </Text>
                      </XStack>
                    </XStack>

                    <Text color="#94A3B8" fontSize={12}>
                      {formatDate(demande.created_at)}
                    </Text>
                  </YStack>

                  {/* Propositions (si disponibles) */}
                  {hasPropositions && (
                    <>
                      <Separator backgroundColor="#E2E8F0" />
                      <Button
                        chromeless
                        padding="$3"
                        onPress={() => toggleExpanded(demande.id)}
                        pressStyle={{ backgroundColor: '#F8FAFC' }}
                      >
                        <XStack justifyContent="space-between" alignItems="center" flex={1}>
                          <Text color="#2563EB" fontWeight="600" fontSize={14}>
                            {demande.propositions.length} pharmacie{demande.propositions.length > 1 ? 's' : ''} disponible{demande.propositions.length > 1 ? 's' : ''}
                          </Text>
                          {isExpanded ? (
                            <ChevronUp size={20} color="#2563EB" />
                          ) : (
                            <ChevronDown size={20} color="#2563EB" />
                          )}
                        </XStack>
                      </Button>

                      {isExpanded && (
                        <YStack backgroundColor="#F8FAFC" padding="$3" gap="$2">
                          {demande.propositions.map((proposition) => (
                            <Card
                              key={proposition.id}
                              padding="$3"
                              backgroundColor="#FFFFFF"
                              borderRadius={12}
                              borderWidth={1}
                              borderColor="#E2E8F0"
                            >
                              <XStack justifyContent="space-between" alignItems="flex-start">
                                <YStack flex={1} marginRight="$2">
                                  <Text fontWeight="600" color="#1E293B" fontSize={15}>
                                    {proposition.pharmacie_nom}
                                  </Text>

                                  <XStack gap="$1" alignItems="center" marginTop={4}>
                                    <MapPin size={12} color="#64748B" />
                                    <Text color="#64748B" fontSize={13}>
                                      {proposition.quartier}
                                      {proposition.adresse && ` - ${proposition.adresse}`}
                                    </Text>
                                  </XStack>

                                  <YStack
                                    backgroundColor="#D1FAE5"
                                    alignSelf="flex-start"
                                    paddingHorizontal={10}
                                    paddingVertical={4}
                                    borderRadius={6}
                                    marginTop={8}
                                  >
                                    <Text color="#059669" fontWeight="700" fontSize={16}>
                                      {proposition.prix.toLocaleString()} FCFA
                                    </Text>
                                  </YStack>
                                </YStack>

                                {proposition.telephone && (
                                  <Button
                                    size="$3"
                                    backgroundColor="#10B981"
                                    borderRadius={50}
                                    width={40}
                                    height={40}
                                    onPress={() => callPharmacy(proposition.telephone!)}
                                    pressStyle={{ opacity: 0.8 }}
                                  >
                                    <Phone size={18} color="white" />
                                  </Button>
                                )}
                              </XStack>
                            </Card>
                          ))}
                        </YStack>
                      )}
                    </>
                  )}
                </Card>
              );
            })
          )}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
