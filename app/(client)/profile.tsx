import { Alert } from 'react-native';
import {
  YStack,
  XStack,
  Text,
  H2,
  Card,
  Button,
  Separator,
  View
} from 'tamagui';
import {
  User,
  Phone,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../_layout';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: signOut
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: Bell,
      label: 'Notifications',
      onPress: () => Alert.alert('Info', 'Fonctionnalité à venir'),
    },
    {
      icon: Shield,
      label: 'Confidentialité',
      onPress: () => Alert.alert('Info', 'Fonctionnalité à venir'),
    },
    {
      icon: HelpCircle,
      label: 'Aide & Support',
      onPress: () => Alert.alert('Info', 'Fonctionnalité à venir'),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <YStack flex={1} backgroundColor="#F1F5F9" padding="$4">
        {/* Header */}
        <YStack marginBottom="$6">
          <H2 color="#1E293B">Mon Profil</H2>
        </YStack>

        {/* Carte Profil */}
        <Card
          padding="$4"
          borderRadius={16}
          backgroundColor="#FFFFFF"
          marginBottom="$4"
          borderWidth={1}
          borderColor="#E2E8F0"
        >
          <XStack gap="$4" alignItems="center">
            {/* Avatar centré */}
            <View
              width={64}
              height={64}
              borderRadius={32}
              backgroundColor="#2563EB"
              alignItems="center"
              justifyContent="center"
            >
              <User size={32} color="white" />
            </View>

            <YStack flex={1}>
              <Text fontWeight="700" fontSize={18} color="#1E293B">
                {profile?.full_name || 'Utilisateur'}
              </Text>

              <XStack gap="$2" alignItems="center" marginTop={4}>
                <Phone size={14} color="#64748B" />
                <Text color="#64748B" fontSize={14}>
                  {profile?.phone || 'Non renseigné'}
                </Text>
              </XStack>

              <YStack
                backgroundColor="#DBEAFE"
                alignSelf="flex-start"
                paddingHorizontal={10}
                paddingVertical={4}
                borderRadius={6}
                marginTop={8}
              >
                <Text color="#2563EB" fontSize={12} fontWeight="600">
                  {profile?.role === 'AGENT' ? 'Agent' : 'Client'}
                </Text>
              </YStack>
            </YStack>
          </XStack>
        </Card>

        {/* Menu */}
        <Card
          borderRadius={16}
          backgroundColor="#FFFFFF"
          marginBottom="$4"
          overflow="hidden"
          borderWidth={1}
          borderColor="#E2E8F0"
        >
          {menuItems.map((item, index) => (
            <YStack key={item.label}>
              {index > 0 && <Separator backgroundColor="#E2E8F0" />}
              <Button
                chromeless
                padding="$3"
                onPress={item.onPress}
                pressStyle={{ backgroundColor: '#F8FAFC' }}
              >
                <XStack flex={1} justifyContent="space-between" alignItems="center">
                  <XStack gap="$3" alignItems="center">
                    <View
                      width={40}
                      height={40}
                      borderRadius={10}
                      backgroundColor="#F1F5F9"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <item.icon size={20} color="#64748B" />
                    </View>
                    <Text color="#1E293B" fontSize={15} fontWeight="500">
                      {item.label}
                    </Text>
                  </XStack>
                  <ChevronRight size={20} color="#94A3B8" />
                </XStack>
              </Button>
            </YStack>
          ))}
        </Card>

        {/* Bouton Déconnexion */}
        <Button
          size="$4"
          backgroundColor="#FEE2E2"
          borderColor="#FECACA"
          borderWidth={1}
          onPress={handleSignOut}
          borderRadius={12}
          pressStyle={{ opacity: 0.8 }}
        >
          <XStack gap="$2" alignItems="center">
            <LogOut size={20} color="#DC2626" />
            <Text color="#DC2626" fontWeight="600">
              Se déconnecter
            </Text>
          </XStack>
        </Button>

        {/* Version */}
        <YStack flex={1} justifyContent="flex-end" alignItems="center">
          <Text color="#94A3B8" fontSize={12}>
            PuzzlePharm v1.0.0
          </Text>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}
