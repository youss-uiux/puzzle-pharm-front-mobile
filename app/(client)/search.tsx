import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import {
  YStack,
  XStack,
  Text,
  H2,
  Input,
  Button,
  TextArea,
  Spinner,
  Card,
  ScrollView
} from 'tamagui';
import { Search as SearchIcon, Send, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';

export default function SearchScreen() {
  const { session } = useAuth();
  const [medicament, setMedicament] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const submitDemande = async () => {
    if (!medicament.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du médicament');
      return;
    }

    dismissKeyboard();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('demandes')
        .insert({
          client_id: session?.user.id,
          medicament_nom: medicament.trim(),
          description: description.trim() || null,
          status: 'en_attente'
        });

      if (error) throw error;

      setSuccess(true);
      setMedicament('');
      setDescription('');

      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer la demande');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" backgroundColor="#F1F5F9">
          <YStack
            backgroundColor="#10B981"
            padding="$4"
            borderRadius={50}
            marginBottom="$4"
          >
            <CheckCircle size={48} color="white" />
          </YStack>
          <H2 textAlign="center" marginBottom="$2" color="#1E293B">
            Demande envoyée !
          </H2>
          <Text color="#64748B" textAlign="center" fontSize={16} lineHeight={24}>
            Notre équipe recherche votre médicament.{'\n'}
            Vous recevrez une notification dès qu'une réponse sera disponible.
          </Text>
          <Button
            marginTop="$6"
            size="$4"
            backgroundColor="#2563EB"
            onPress={() => setSuccess(false)}
            borderRadius={12}
            pressStyle={{ opacity: 0.8 }}
          >
            <Text color="white" fontWeight="600">Nouvelle recherche</Text>
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            flex={1}
            backgroundColor="#F1F5F9"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <YStack flex={1} padding="$4">
              {/* Header */}
              <YStack marginBottom="$6">
                <H2 color="#1E293B" marginBottom="$2">
                  Rechercher un médicament
                </H2>
                <Text color="#64748B" fontSize={14} lineHeight={20}>
                  Décrivez le médicament que vous recherchez et notre équipe vous trouvera les meilleures options.
                </Text>
              </YStack>

              {/* Formulaire */}
              <YStack gap="$4" flex={1}>
                {/* Nom du médicament */}
                <YStack>
                  <Text color="#1E293B" fontWeight="600" marginBottom="$2" fontSize={14}>
                    Nom du médicament *
                  </Text>
                  <XStack
                    borderWidth={1}
                    borderColor="#CBD5E1"
                    borderRadius={12}
                    alignItems="center"
                    paddingHorizontal="$3"
                    backgroundColor="#FFFFFF"
                  >
                    <SearchIcon size={20} color="#64748B" />
                    <Input
                      flex={1}
                      placeholder="Ex: Doliprane 1000mg, Amoxicilline..."
                      value={medicament}
                      onChangeText={setMedicament}
                      borderWidth={0}
                      backgroundColor="transparent"
                      paddingLeft="$2"
                      fontSize={15}
                      color="#1E293B"
                    />
                  </XStack>
                </YStack>

                {/* Description optionnelle */}
                <YStack>
                  <Text color="#1E293B" fontWeight="600" marginBottom="$2" fontSize={14}>
                    Détails supplémentaires (optionnel)
                  </Text>
                  <TextArea
                    placeholder="Dosage spécifique, forme (comprimé, sirop...), marque préférée..."
                    value={description}
                    onChangeText={setDescription}
                    minHeight={100}
                    borderWidth={1}
                    borderColor="#CBD5E1"
                    borderRadius={12}
                    backgroundColor="#FFFFFF"
                    padding="$3"
                    fontSize={15}
                    color="#1E293B"
                  />
                </YStack>

                {/* Info Card */}
                <Card
                  padding="$3"
                  backgroundColor="#DBEAFE"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor="#93C5FD"
                >
                  <XStack gap="$2">
                    <Text fontSize={20}>💡</Text>
                    <YStack flex={1}>
                      <Text color="#1E40AF" fontSize={13} lineHeight={18}>
                        Notre équipe du Call Center reçoit votre demande en temps réel et vous répond avec les pharmacies où le médicament est disponible, ainsi que les prix.
                      </Text>
                    </YStack>
                  </XStack>
                </Card>

                {/* Spacer */}
                <YStack flex={1} />

                {/* Bouton d'envoi */}
                <Button
                  size="$5"
                  backgroundColor="#2563EB"
                  onPress={submitDemande}
                  disabled={loading || !medicament.trim()}
                  opacity={loading || !medicament.trim() ? 0.6 : 1}
                  borderRadius={12}
                  pressStyle={{ opacity: 0.8 }}
                  marginTop="$4"
                  marginBottom="$2"
                >
                  {loading ? (
                    <XStack gap="$2" alignItems="center">
                      <Spinner color="white" />
                      <Text color="white" fontWeight="600">Envoi en cours...</Text>
                    </XStack>
                  ) : (
                    <XStack gap="$2" alignItems="center">
                      <Send size={20} color="white" />
                      <Text color="white" fontWeight="600">Envoyer la demande</Text>
                    </XStack>
                  )}
                </Button>
              </YStack>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
