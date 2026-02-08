import { useEffect, useState, useCallback } from 'react';
import { RefreshControl, Alert } from 'react-native';
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
  Input,
  Separator,
  Sheet
} from 'tamagui';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  X,
  Phone
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, Demande } from '../../lib/supabase';
import { useAuth } from '../_layout';

type DemandeWithClient = Demande & {
  profiles: {
    phone: string;
    full_name: string | null;
  };
};

type PropositionForm = {
  pharmacie_nom: string;
  prix: string;
  quartier: string;
  adresse: string;
  telephone: string;
};

const emptyProposition: PropositionForm = {
  pharmacie_nom: '',
  prix: '',
  quartier: '',
  adresse: '',
  telephone: '',
};

export default function DemandesScreen() {
  const { session } = useAuth();
  const [demandes, setDemandes] = useState<DemandeWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<DemandeWithClient | null>(null);
  const [propositions, setPropositions] = useState<PropositionForm[]>([{ ...emptyProposition }]);
  const [submitting, setSubmitting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'en_cours' | 'traite'>('en_attente');

  const fetchDemandes = useCallback(async () => {
    try {
      let query = supabase
        .from('demandes')
        .select(`
          *,
          profiles:client_id (phone, full_name)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDemandes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDemandes();

    const channel = supabase
      .channel('agent-demandes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demandes',
        },
        () => {
          fetchDemandes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDemandes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDemandes();
  };

  const openResponseSheet = async (demande: DemandeWithClient) => {
    setSelectedDemande(demande);
    setPropositions([{ ...emptyProposition }]);
    setSheetOpen(true);

    if (demande.status === 'en_attente') {
      await supabase
        .from('demandes')
        .update({
          status: 'en_cours',
          agent_id: session?.user.id
        })
        .eq('id', demande.id);
    }
  };

  const addProposition = () => {
    setPropositions([...propositions, { ...emptyProposition }]);
  };

  const removeProposition = (index: number) => {
    if (propositions.length > 1) {
      setPropositions(propositions.filter((_, i) => i !== index));
    }
  };

  const updateProposition = (index: number, field: keyof PropositionForm, value: string) => {
    const updated = [...propositions];
    updated[index][field] = value;
    setPropositions(updated);
  };

  const submitPropositions = async () => {
    if (!selectedDemande) return;

    const validPropositions = propositions.filter(
      p => p.pharmacie_nom.trim() && p.prix.trim() && p.quartier.trim()
    );

    if (validPropositions.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une proposition valide');
      return;
    }

    setSubmitting(true);
    try {
      const { error: propError } = await supabase
        .from('propositions')
        .insert(
          validPropositions.map(p => ({
            demande_id: selectedDemande.id,
            pharmacie_nom: p.pharmacie_nom.trim(),
            prix: parseFloat(p.prix),
            quartier: p.quartier.trim(),
            adresse: p.adresse.trim() || null,
            telephone: p.telephone.trim() || null,
            disponible: true,
          }))
        );

      if (propError) throw propError;

      const { error: updateError } = await supabase
        .from('demandes')
        .update({ status: 'traite' })
        .eq('id', selectedDemande.id);

      if (updateError) throw updateError;

      Alert.alert('Succès', 'Propositions envoyées au client');
      setSheetOpen(false);
      setSelectedDemande(null);
      setPropositions([{ ...emptyProposition }]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer les propositions');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'en_attente':
        return { label: 'En attente', color: '#F59E0B', bgColor: '#FEF3C7', icon: Clock };
      case 'en_cours':
        return { label: 'En cours', color: '#3B82F6', bgColor: '#DBEAFE', icon: AlertCircle };
      case 'traite':
        return { label: 'Traité', color: '#10B981', bgColor: '#D1FAE5', icon: CheckCircle };
      default:
        return { label: status, color: '#64748B', bgColor: '#F1F5F9', icon: Clock };
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

  const FilterButton = ({ value, label }: { value: typeof filter; label: string }) => (
    <Button
      size="$2"
      backgroundColor={filter === value ? '$green10' : '$gray3'}
      onPress={() => setFilter(value)}
      borderRadius="$3"
      paddingHorizontal="$3"
    >
      <Text color={filter === value ? 'white' : '$gray11'} fontSize="$2" fontWeight="500">
        {label}
      </Text>
    </Button>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$4" paddingBottom="$2">
          <H2 color="$gray12" marginBottom="$3">Demandes</H2>

          {/* Filtres */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              <FilterButton value="en_attente" label="En attente" />
              <FilterButton value="en_cours" label="En cours" />
              <FilterButton value="traite" label="Traités" />
              <FilterButton value="all" label="Tous" />
            </XStack>
          </ScrollView>
        </YStack>

        {/* Liste des demandes */}
        <ScrollView
          flex={1}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <YStack padding="$4" paddingTop="$2" gap="$3">
            {loading ? (
              <YStack alignItems="center" padding="$8">
                <Spinner size="large" color="$green10" />
              </YStack>
            ) : demandes.length === 0 ? (
              <Card
                padding="$6"
                backgroundColor="$gray2"
                borderRadius="$4"
              >
                <YStack alignItems="center">
                  <Text fontSize={48} marginBottom="$3">📭</Text>
                  <H4 color="$gray12" textAlign="center">
                    Aucune demande
                  </H4>
                  <Text color="$gray11" textAlign="center" marginTop="$1">
                    Aucune demande {filter !== 'all' ? `"${filter.replace('_', ' ')}"` : ''} pour le moment
                  </Text>
                </YStack>
              </Card>
            ) : (
              demandes.map((demande) => {
                const statusConfig = getStatusConfig(demande.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card
                    key={demande.id}
                    elevation="$1"
                    borderRadius="$4"
                    backgroundColor="white"
                    pressStyle={{ scale: 0.98 }}
                    onPress={() => openResponseSheet(demande)}
                  >
                    <YStack padding="$3">
                      <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$2">
                        <YStack flex={1} marginRight="$2">
                          <Text fontWeight="700" fontSize="$5" color="$gray12">
                            {demande.medicament_nom}
                          </Text>
                          {demande.description && (
                            <Text color="$gray11" fontSize="$2" marginTop="$1">
                              {demande.description}
                            </Text>
                          )}
                        </YStack>

                        <XStack
                          backgroundColor={statusConfig.bgColor}
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                          alignItems="center"
                          gap="$1"
                        >
                          <StatusIcon size={12} color={statusConfig.color} />
                          <Text color={statusConfig.color} fontSize="$2" fontWeight="600">
                            {statusConfig.label}
                          </Text>
                        </XStack>
                      </XStack>

                      <Separator marginVertical="$2" />

                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack>
                          <XStack gap="$1" alignItems="center">
                            <Phone size={12} color="#64748B" />
                            <Text color="$gray11" fontSize="$2">
                              {demande.profiles?.full_name || demande.profiles?.phone}
                            </Text>
                          </XStack>
                          <Text color="$gray10" fontSize="$2" marginTop="$1">
                            {formatDate(demande.created_at)}
                          </Text>
                        </YStack>

                        {demande.status !== 'traite' && (
                          <Button
                            size="$3"
                            backgroundColor="$green10"
                            borderRadius="$2"
                            pressStyle={{ opacity: 0.8 }}
                          >
                            <Text color="white" fontSize="$2" fontWeight="600">
                              Répondre
                            </Text>
                          </Button>
                        )}
                      </XStack>
                    </YStack>
                  </Card>
                );
              })
            )}
          </YStack>
        </ScrollView>
      </YStack>

      {/* Sheet pour répondre */}
      <Sheet
        modal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        snapPoints={[90]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4" backgroundColor="$background">
          <Sheet.Handle />

          <ScrollView>
            <YStack gap="$4" paddingBottom="$6">
              {/* Header */}
              <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                  <H4 color="$gray12">Répondre à la demande</H4>
                  <Text color="$blue10" fontWeight="600" marginTop="$1">
                    {selectedDemande?.medicament_nom}
                  </Text>
                </YStack>
                <Button
                  size="$3"
                  circular
                  backgroundColor="$gray3"
                  onPress={() => setSheetOpen(false)}
                >
                  <X size={20} color="#64748B" />
                </Button>
              </XStack>

              <Separator />

              {/* Propositions */}
              {propositions.map((prop, index) => (
                <Card
                  key={index}
                  padding="$3"
                  borderRadius="$3"
                  backgroundColor="$gray1"
                >
                  <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                    <Text fontWeight="600" color="$gray12">
                      Pharmacie #{index + 1}
                    </Text>
                    {propositions.length > 1 && (
                      <Button
                        size="$2"
                        circular
                        backgroundColor="$red3"
                        onPress={() => removeProposition(index)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </Button>
                    )}
                  </XStack>

                  <YStack gap="$2">
                    <Input
                      placeholder="Nom de la pharmacie *"
                      value={prop.pharmacie_nom}
                      onChangeText={(v) => updateProposition(index, 'pharmacie_nom', v)}
                      backgroundColor="white"
                    />

                    <XStack gap="$2">
                      <Input
                        flex={1}
                        placeholder="Prix (FCFA) *"
                        value={prop.prix}
                        onChangeText={(v) => updateProposition(index, 'prix', v)}
                        keyboardType="numeric"
                        backgroundColor="white"
                      />
                      <Input
                        flex={1}
                        placeholder="Quartier *"
                        value={prop.quartier}
                        onChangeText={(v) => updateProposition(index, 'quartier', v)}
                        backgroundColor="white"
                      />
                    </XStack>

                    <Input
                      placeholder="Adresse (optionnel)"
                      value={prop.adresse}
                      onChangeText={(v) => updateProposition(index, 'adresse', v)}
                      backgroundColor="white"
                    />

                    <Input
                      placeholder="Téléphone (optionnel)"
                      value={prop.telephone}
                      onChangeText={(v) => updateProposition(index, 'telephone', v)}
                      keyboardType="phone-pad"
                      backgroundColor="white"
                    />
                  </YStack>
                </Card>
              ))}

              {/* Bouton ajouter */}
              <Button
                size="$4"
                backgroundColor="$gray3"
                onPress={addProposition}
                borderRadius="$3"
              >
                <XStack gap="$2" alignItems="center">
                  <Plus size={20} color="#64748B" />
                  <Text color="$gray11">Ajouter une pharmacie</Text>
                </XStack>
              </Button>

              {/* Bouton envoyer */}
              <Button
                size="$5"
                backgroundColor="$green10"
                onPress={submitPropositions}
                disabled={submitting}
                opacity={submitting ? 0.7 : 1}
                borderRadius="$4"
              >
                {submitting ? (
                  <XStack gap="$2" alignItems="center">
                    <Spinner color="white" />
                    <Text color="white">Envoi...</Text>
                  </XStack>
                ) : (
                  <XStack gap="$2" alignItems="center">
                    <Send size={20} color="white" />
                    <Text color="white" fontWeight="600">Envoyer au client</Text>
                  </XStack>
                )}
              </Button>
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </SafeAreaView>
  );
}
