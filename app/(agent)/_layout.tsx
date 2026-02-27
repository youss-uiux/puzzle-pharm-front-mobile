import { Tabs } from 'expo-router';
import { LayoutDashboard, ClipboardList, User, Building2 } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import {
  pillTabBarLabelStyle,
  pillTabBarColors,
  colors,
  radius,
  shadows,
} from '../../components/design-system';

// Custom tab bar background component - simple semi-transparent fallback
const TabBarBackground = () => (
  <View style={styles.tabBarContainer} />
);

export default function AgentLayout() {
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
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <LayoutDashboard size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="demandes"
        options={{
          title: 'Demandes',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <ClipboardList size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="pharmacies-garde"
        options={{
          title: 'Pharmacies',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Building2 size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
