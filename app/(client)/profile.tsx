/**
 * Profile Screen - Client
 * Modern Apothecary Design System
 */
import { Alert, StyleSheet, Platform, Pressable, Animated, View as RNView, Text } from 'react-native';
import { ScrollView, View } from 'tamagui';
import {
  User,
  Phone,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  Sparkles
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../_layout';
import { useEffect, useRef } from 'react';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  BackgroundShapes,
} from '../../components/design-system';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

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
    { icon: Bell, label: 'Notifications', color: colors.accent.primary },
    { icon: Shield, label: 'Confidentialité', color: colors.success.primary },
    { icon: HelpCircle, label: 'Aide & Support', color: colors.info.primary },
  ];

  return (
    <RNView style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundShapes variant="profile" />

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
            <Text style={styles.headerTitle}>Profil</Text>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View
            style={[
              styles.profileCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.1) }]
              }
            ]}
          >
            <RNView style={styles.avatar}>
              <User size={32} color={colors.text.primary} />
            </RNView>

            <RNView style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.full_name || 'Utilisateur'}
              </Text>
              <RNView style={styles.profilePhone}>
                <Phone size={14} color={colors.text.tertiary} />
                <Text style={styles.profilePhoneText}>
                  {profile?.phone || 'Non renseigné'}
                </Text>
              </RNView>
              <RNView style={[
                styles.roleBadge,
                profile?.role === 'AGENT' && styles.roleBadgeAgent
              ]}>
                <Sparkles size={12} color={profile?.role === 'AGENT' ? colors.success.primary : colors.accent.primary} />
                <Text style={[
                  styles.roleBadgeText,
                  profile?.role === 'AGENT' && styles.roleBadgeTextAgent
                ]}>
                  {profile?.role === 'AGENT' ? 'Agent' : 'Client'}
                </Text>
              </RNView>
            </RNView>
          </Animated.View>

          {/* Menu Card */}
          <Animated.View
            style={[
              styles.menuCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }]
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
                  <RNView style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                    <Icon size={20} color={item.color} />
                  </RNView>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ChevronRight size={20} color={colors.text.tertiary} />
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Logout Button */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 1.3) }]
            }}
          >
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed
              ]}
            >
              <LogOut size={20} color={colors.error.primary} />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </Pressable>
          </Animated.View>

          {/* Version */}
          <Text style={styles.version}>PuzzlePharm v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </RNView>
  );
}

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
    paddingBottom: 120,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
  },

  // Profile Card
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.avatar,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
    ...shadows.accent,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  profilePhone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  profilePhoneText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  roleBadge: {
    backgroundColor: colors.accent.light,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  roleBadgeAgent: {
    backgroundColor: colors.success.light,
  },
  roleBadgeText: {
    ...typography.caption,
    color: colors.accent.secondary,
    fontWeight: '600',
  },
  roleBadgeTextAgent: {
    color: colors.success.secondary,
  },

  // Menu Card
  menuCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuItemPressed: {
    backgroundColor: colors.surface.secondary,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },

  // Logout Button
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.error.light,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    ...typography.label,
    color: colors.error.primary,
  },

  // Version
  version: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.text.tertiary,
    paddingBottom: spacing.lg,
  },
});
