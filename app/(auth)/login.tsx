import { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  H1,
  Paragraph,
  Spinner,
  ScrollView
} from 'tamagui';
import { Phone } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session, profile, isLoading } = useAuth();

  // Redirection automatique si déjà connecté
  useEffect(() => {
    if (!isLoading && session && profile) {
      if (profile.role === 'AGENT') {
        router.replace('/(agent)/dashboard');
      } else {
        router.replace('/(client)/home');
      }
    }
  }, [session, profile, isLoading]);

  const formatPhoneNumber = (value: string) => {
    return value.replace(/[^\d+]/g, '');
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhoneNumber(value));
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLogin = async () => {
    if (!phone || phone.length < 8) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
      return;
    }

    dismissKeyboard();
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+227${phone}`;

      // Connexion simplifiée sans OTP - utiliser un mot de passe basé sur le numéro
      const password = `puzzle_${formattedPhone}_temp`;

      // Essayer de se connecter d'abord
      const { error: signInError } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password: password,
      });

      if (signInError) {
        // Si l'utilisateur n'existe pas, le créer
        if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            phone: formattedPhone,
            password: password,
            options: {
              data: {
                phone: formattedPhone,
              }
            }
          });

          if (signUpError) {
            // Si l'utilisateur est déjà enregistré, essayer de se connecter à nouveau
            if (signUpError.message.includes('User already registered')) {
              // Peut-être que le mot de passe est différent, afficher un message
              Alert.alert(
                'Compte existant',
                'Ce numéro est déjà enregistré. Si vous ne pouvez pas vous connecter, contactez le support.'
              );
            } else {
              throw signUpError;
            }
          } else {
            // Inscription réussie, maintenant se connecter
            const { error: loginAfterSignUp } = await supabase.auth.signInWithPassword({
              phone: formattedPhone,
              password: password,
            });

            if (loginAfterSignUp) {
              throw loginAfterSignUp;
            }

            Alert.alert('Bienvenue !', 'Votre compte a été créé avec succès.');
          }
        } else {
          throw signInError;
        }
      }

      // La redirection sera gérée automatiquement par useProtectedRoute
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Afficher un loader si on vérifie la session
  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor="#F1F5F9" justifyContent="center" alignItems="center">
        <StatusBar style="dark" />
        <Spinner size="large" color="#2563EB" />
      </YStack>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#F1F5F9' }}
      >
        <StatusBar style="dark" />
        <ScrollView
          flex={1}
          backgroundColor="#F1F5F9"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <YStack
            flex={1}
            padding="$4"
            justifyContent="center"
          >
            {/* Logo et Titre */}
            <YStack alignItems="center" marginBottom="$8">
              <YStack
                width={100}
                height={100}
                backgroundColor="#2563EB"
                borderRadius={50}
                alignItems="center"
                justifyContent="center"
                marginBottom="$4"
                shadowColor="#2563EB"
                shadowOffset={{ width: 0, height: 4 }}
                shadowOpacity={0.3}
                shadowRadius={8}
              >
                <Text fontSize={40}>💊</Text>
              </YStack>

              <H1
                textAlign="center"
                color="#2563EB"
                marginBottom="$2"
              >
                PuzzlePharm
              </H1>

              <Paragraph
                textAlign="center"
                color="#64748B"
                fontSize={15}
              >
                Trouvez vos médicaments facilement
              </Paragraph>
            </YStack>

            {/* Formulaire */}
            <YStack
              backgroundColor="#FFFFFF"
              padding="$4"
              borderRadius={16}
              borderWidth={1}
              borderColor="#E2E8F0"
              marginBottom="$6"
            >
              <Text
                fontSize={18}
                fontWeight="700"
                color="#1E293B"
                marginBottom="$2"
              >
                Connexion / Inscription
              </Text>

              <Paragraph color="#64748B" marginBottom="$4" fontSize={14}>
                Entrez votre numéro de téléphone pour continuer
              </Paragraph>

              <XStack
                borderWidth={1}
                borderColor="#CBD5E1"
                borderRadius={12}
                alignItems="center"
                paddingHorizontal="$3"
                backgroundColor="#F8FAFC"
                marginBottom="$3"
              >
                <Phone size={20} color="#64748B" />
                <Input
                  flex={1}
                  placeholder="Ex: 90 84 84 24"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  borderWidth={0}
                  backgroundColor="transparent"
                  paddingLeft="$2"
                  fontSize={16}
                  color="#1E293B"
                />
              </XStack>

              <Paragraph color="#94A3B8" fontSize={12}>
                Préfixe +227 (Niger) ajouté automatiquement
              </Paragraph>
            </YStack>

            {/* Bouton de connexion */}
            <Button
              size="$5"
              backgroundColor="#2563EB"
              onPress={handleLogin}
              disabled={loading || !phone}
              opacity={loading || !phone ? 0.6 : 1}
              borderRadius={12}
              pressStyle={{ opacity: 0.8 }}
            >
              {loading ? (
                <XStack gap="$2" alignItems="center">
                  <Spinner color="white" />
                  <Text color="white" fontWeight="600">Connexion...</Text>
                </XStack>
              ) : (
                <Text color="white" fontWeight="600" fontSize={16}>Continuer</Text>
              )}
            </Button>

            {/* Footer */}
            <YStack marginTop="$8" alignItems="center">
              <Paragraph color="#94A3B8" fontSize={12} textAlign="center" lineHeight={18}>
                En continuant, vous acceptez nos conditions{'\n'}d'utilisation et notre politique de confidentialité
              </Paragraph>
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
