import { Tabs } from 'expo-router';
import { Home, Search, Clock, User } from 'lucide-react-native';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  pillTabBarLabelStyle,
  pillTabBarColors,
  colors,
  radius,
  shadows,
} from '../../components/design-system';

// Custom tab bar background component with glassmorphism
const TabBarBackground = () => {
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.tabBarContainer}>
        <BlurView intensity={80} tint="light" style={styles.blur}>
          <View style={styles.glassOverlay} />
        </BlurView>
      </View>
    );
  }

  // Android fallback
  return <View style={[styles.tabBarContainer, styles.androidBackground]} />;
};

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: pillTabBarColors.active,
        tabBarInactiveTintColor: pillTabBarColors.inactive,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 20,
          left: 24,
          right: 24,
          height: 70,
          borderRadius: radius.pill,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingBottom: 0,
          paddingTop: 0,
          shadowColor: shadows.lg.shadowColor,
          shadowOffset: shadows.lg.shadowOffset,
          shadowOpacity: shadows.lg.shadowOpacity,
          shadowRadius: shadows.lg.shadowRadius,
          elevation: shadows.lg.elevation,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          ...pillTabBarLabelStyle,
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingTop: 10,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Rechercher',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Search size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Clock size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  blur: {
    flex: 1,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  androidBackground: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  activeIconContainer: {
    backgroundColor: colors.accent.light,
    padding: 6,
    borderRadius: 12,
    marginBottom: -4,
  },
});
