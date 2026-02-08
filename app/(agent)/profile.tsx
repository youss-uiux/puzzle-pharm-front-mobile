import { Alert, StyleSheet, Pressable, Animated } from 'react-native';
import { ScrollView, View } from 'tamagui';
import {
  Phone,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  Headphones,
  Sparkles
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../_layout';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

export default function AgentProfileScreen() {
  const { profile, signOut } = useAuth();

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
    { icon: Headphones, label: 'Paramètres Agent', color: '#10B981' },
    { icon: Bell, label: 'Notifications', color: '#F59E0B' },
    { icon: Shield, label: 'Sécurité', color: '#3B82F6' },
    { icon: HelpCircle, label: 'Aide', color: '#8B5CF6' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0A1628', '#132F4C', '#0A1628']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
            <Text style={styles.headerTitle}>Mon Profil</Text>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View
            style={[
              styles.profileCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }]
              }
            ]}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.avatar}
            >
              <Headphones size={32} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.full_name || 'Agent'}
              </Text>
              <View style={styles.profilePhone}>
                <Phone size={14} color="rgba(255,255,255,0.4)" />
                <Text style={styles.profilePhoneText}>
                  {profile?.phone || 'Non renseigné'}
                </Text>
              </View>
              <View style={styles.roleBadge}>
                <Sparkles size={12} color="#10B981" />
                <Text style={styles.roleBadgeText}>Agent Call Center</Text>
              </View>
            </View>
          </Animated.View>

          {/* Menu */}
          <Animated.View
            style={[
              styles.menuCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.4) }]
              }
            ]}
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === menuItems.length - 1;

              return (
                <Pressable
                  key={item.label}
                  onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                    isLast && styles.menuItemLast
                  ]}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Logout Button */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 1.6) }]
            }}
          >
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed
              ]}
            >
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </Pressable>
          </Animated.View>

          {/* Version */}
          <Text style={styles.version}>PuzzlePharm Agent v1.0.0</Text>
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
  scrollContent: {
    paddingBottom: 120,
  },

  // Decorative
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    top: -50,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
    bottom: 300,
    left: -40,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  // Profile Card
  profileCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  profilePhone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  profilePhoneText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  roleBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },

  // Menu Card
  menuCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Logout Button
  logoutButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Version
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    paddingBottom: 20,
  },
});
