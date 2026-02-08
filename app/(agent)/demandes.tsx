import { useEffect, useState, useCallback } from 'react';
import { RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
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
  View
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
import { StatusBar } from 'expo-status-bar';
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
  const [modalVisible, setModalVisible] = useState(false);
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

  const openResponseModal = async (demande: DemandeWithClient) => {
    setSelectedDemande(demande);
    setPropositions([{ ...emptyProposition }]);
    setModalVisible(true);

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

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDemande(null);
    setPropositions([{ ...emptyProposition }]);
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

    Keyboard.dismiss();
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
      closeModal();
      fetchDemandes();
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
      size="$3"
      backgroundColor={filter === value ? '#10B981' : '#FFFFFF'}
      onPress={() => setFilter(value)}
      borderRadius={10}
      paddingHorizontal="$3"
      borderWidth={1}
      borderColor={filter === value ? '#10B981' : '#E2E8F0'}
      pressStyle={{ opacity: 0.8 }}
    >
      <Text color={filter === value ? 'white' : '#64748B'} fontSize={13} fontWeight="500">
        {label}
      </Text>
    </Button>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <StatusBar style="dark" />
      <YStack flex={1} backgroundColor="#F1F5F9">
        {/* Header */}
        <YStack padding="$4" paddingBottom="$2">
          <H2 color="#1E293B" marginBottom="$3">Demandes</H2>

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
          <YStack padding="$4" paddingTop="$2" gap="$3" paddingBottom="$6">
            {loading ? (
              <YStack alignItems="center" padding="$8">
                <Spinner size="large" color="#10B981" />
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
                  <Text fontSize={48} marginBottom="$3">📭</Text>
                  <H4 color="#1E293B" textAlign="center">
                    Aucune demande
                  </H4>
                  <Text color="#64748B" textAlign="center" marginTop="$1">
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
                    borderRadius={16}
                    backgroundColor="#FFFFFF"
                    pressStyle={{ scale: 0.98 }}
                    onPress={() => demande.status !== 'traite' && openResponseModal(demande)}
                    borderWidth={1}
                    borderColor="#E2E8F0"
                  >
                    <YStack padding="$4">
                      <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$2">
                        <YStack flex={1} marginRight="$2">
                          <Text fontWeight="700" fontSize={17} color="#1E293B">
                            {demande.medicament_nom}
                          </Text>
                          {demande.description && (
                            <Text color="#64748B" fontSize={13} marginTop={4}>
                              {demande.description}
                            </Text>
                          )}
                        </YStack>

                        <View
                          backgroundColor={statusConfig.bgColor}
                          paddingHorizontal={10}
                          paddingVertical={4}
                          borderRadius={8}
                          flexDirection="row"
                          alignItems="center"
                          gap={4}
                        >
                          <StatusIcon size={12} color={statusConfig.color} />
                          <Text color={statusConfig.color} fontSize={12} fontWeight="600">
                            {statusConfig.label}
                          </Text>
                        </View>
                      </XStack>

                      <Separator backgroundColor="#E2E8F0" marginVertical="$3" />

                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack>
                          <XStack gap="$2" alignItems="center">
                            <Phone size={14} color="#64748B" />
                            <Text color="#64748B" fontSize={13}>
                              {demande.profiles?.full_name || demande.profiles?.phone}
                            </Text>
                          </XStack>
                          <Text color="#94A3B8" fontSize={12} marginTop={4}>
                            {formatDate(demande.created_at)}
                          </Text>
                        </YStack>

                        {demande.status !== 'traite' && (
                          <Button
                            size="$3"
                            backgroundColor="#10B981"
                            borderRadius={10}
                            pressStyle={{ opacity: 0.8 }}
                            onPress={() => openResponseModal(demande)}
                          >
                            <Text color="white" fontSize={13} fontWeight="600">
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

      {/* Modal pour répondre - Remplace le Sheet qui causait l'erreur */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <YStack flex={1} backgroundColor="#F1F5F9">
                {/* Header du Modal */}
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  padding="$4"
                  backgroundColor="#FFFFFF"
                  borderBottomWidth={1}
                  borderBottomColor="#E2E8F0"
                >
                  <YStack>
                    <H4 color="#1E293B">Répondre à la demande</H4>
                    <Text color="#2563EB" fontWeight="600" marginTop={2}>
                      {selectedDemande?.medicament_nom}
                    </Text>
                  </YStack>
                  <Button
                    size="$3"
                    circular
                    backgroundColor="#F1F5F9"
                    onPress={closeModal}
                    pressStyle={{ opacity: 0.7 }}
                  >
                    <X size={20} color="#64748B" />
                  </Button>
                </XStack>

                {/* Contenu du Modal */}
                <ScrollView flex={1} keyboardShouldPersistTaps="handled">
                  <YStack gap="$4" padding="$4">
                    {/* Note explicative */}
                    <Card
                      padding="$3"
                      backgroundColor="#DBEAFE"
                      borderRadius={12}
                      borderWidth={1}
                      borderColor="#93C5FD"
                    >
                      <XStack gap="$2" alignItems="flex-start">
                        <Text fontSize={18}>💡</Text>
                        <YStack flex={1}>
                          <Text color="#1E40AF" fontSize={13} fontWeight="600" marginBottom={2}>
                            Comment répondre ?
                          </Text>
                          <Text color="#1E40AF" fontSize={12} lineHeight={18}>
                            Ajoutez une ou plusieurs pharmacies où le médicament est disponible avec le prix. Les champs marqués d'un <Text color="#EF4444">*</Text> sont obligatoires.
                          </Text>
                        </YStack>
                      </XStack>
                    </Card>

                    {/* Propositions */}
                    {propositions.map((prop, index) => (
                      <Card
                        key={index}
                        padding="$4"
                        borderRadius={16}
                        backgroundColor="#FFFFFF"
                        borderWidth={1}
                        borderColor="#E2E8F0"
                      >
                        <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
                          <Text fontWeight="700" color="#1E293B" fontSize={15}>
                            Pharmacie #{index + 1}
                          </Text>
                          {propositions.length > 1 && (
                            <Button
                              size="$2"
                              circular
                              backgroundColor="#FEE2E2"
                              onPress={() => removeProposition(index)}
                              pressStyle={{ opacity: 0.7 }}
                            >
                              <Trash2 size={16} color="#DC2626" />
                            </Button>
                          )}
                        </XStack>

                        <YStack gap="$3">
                          <YStack>
                            <Text color="#1E293B" fontWeight="600" fontSize={13} marginBottom={6}>
                              Nom de la pharmacie <Text color="#EF4444">*</Text>
                            </Text>
                            <Input
                              placeholder="Ex: Pharmacie Centrale"
                              value={prop.pharmacie_nom}
                              onChangeText={(v) => updateProposition(index, 'pharmacie_nom', v)}
                              backgroundColor="#F8FAFC"
                              borderWidth={1}
                              borderColor="#E2E8F0"
                              borderRadius={10}
                              fontSize={15}
                              color="#1E293B"
                            />
                          </YStack>

                          <XStack gap="$3">
                            <YStack flex={1}>
                              <Text color="#1E293B" fontWeight="600" fontSize={13} marginBottom={6}>
                                Prix (FCFA) <Text color="#EF4444">*</Text>
                              </Text>
                              <Input
                                placeholder="Ex: 2500"
                                value={prop.prix}
                                onChangeText={(v) => updateProposition(index, 'prix', v)}
                                keyboardType="numeric"
                                backgroundColor="#F8FAFC"
                                borderWidth={1}
                                borderColor="#E2E8F0"
                                borderRadius={10}
                                fontSize={15}
                                color="#1E293B"
                              />
                            </YStack>
                            <YStack flex={1}>
                              <Text color="#1E293B" fontWeight="600" fontSize={13} marginBottom={6}>
                                Quartier <Text color="#EF4444">*</Text>
                              </Text>
                              <Input
                                placeholder="Ex: Plateau"
                                value={prop.quartier}
                                onChangeText={(v) => updateProposition(index, 'quartier', v)}
                                backgroundColor="#F8FAFC"
                                borderWidth={1}
                                borderColor="#E2E8F0"
                                borderRadius={10}
                                fontSize={15}
                                color="#1E293B"
                              />
                            </YStack>
                          </XStack>

                          <YStack>
                            <Text color="#64748B" fontWeight="500" fontSize={13} marginBottom={6}>
                              Adresse complète (optionnel)
                            </Text>
                            <Input
                              placeholder="Ex: Rue du Commerce, à côté de la banque"
                              value={prop.adresse}
                              onChangeText={(v) => updateProposition(index, 'adresse', v)}
                              backgroundColor="#F8FAFC"
                              borderWidth={1}
                              borderColor="#E2E8F0"
                              borderRadius={10}
                              fontSize={15}
                              color="#1E293B"
                            />
                          </YStack>

                          <YStack>
                            <Text color="#64748B" fontWeight="500" fontSize={13} marginBottom={6}>
                              Téléphone de la pharmacie (optionnel)
                            </Text>
                            <Input
                              placeholder="Ex: 90 00 00 00"
                              value={prop.telephone}
                              onChangeText={(v) => updateProposition(index, 'telephone', v)}
                              keyboardType="phone-pad"
                              backgroundColor="#F8FAFC"
                              borderWidth={1}
                              borderColor="#E2E8F0"
                              borderRadius={10}
                              fontSize={15}
                              color="#1E293B"
                            />
                          </YStack>
                        </YStack>
                      </Card>
                    ))}

                    {/* Bouton ajouter */}
                    <Button
                      size="$4"
                      backgroundColor="#FFFFFF"
                      onPress={addProposition}
                      borderRadius={12}
                      borderWidth={1}
                      borderColor="#E2E8F0"
                      pressStyle={{ opacity: 0.8 }}
                    >
                      <XStack gap="$2" alignItems="center">
                        <Plus size={20} color="#64748B" />
                        <Text color="#64748B" fontWeight="500">Ajouter une pharmacie</Text>
                      </XStack>
                    </Button>
                  </YStack>
                </ScrollView>

                {/* Footer avec bouton envoyer */}
                <YStack
                  padding="$4"
                  backgroundColor="#FFFFFF"
                  borderTopWidth={1}
                  borderTopColor="#E2E8F0"
                >
                  <Button
                    size="$5"
                    backgroundColor="#10B981"
                    onPress={submitPropositions}
                    disabled={submitting}
                    opacity={submitting ? 0.7 : 1}
                    borderRadius={12}
                    pressStyle={{ opacity: 0.8 }}
                  >
                    {submitting ? (
                      <XStack gap="$2" alignItems="center">
                        <Spinner color="white" />
                        <Text color="white" fontWeight="600">Envoi...</Text>
                      </XStack>
                    ) : (
                      <XStack gap="$2" alignItems="center">
                        <Send size={20} color="white" />
                        <Text color="white" fontWeight="600">Envoyer au client</Text>
                      </XStack>
                    )}
                  </Button>
                </YStack>
              </YStack>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
