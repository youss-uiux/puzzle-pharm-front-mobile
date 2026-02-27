import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import 'react-native-reanimated';
import { Session } from '@supabase/supabase-js';

import { supabase, Profile } from '../lib/supabase';
import { useColorScheme } from '@/components/useColorScheme';
import { ToastProvider } from '../components/design-system';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';

// Contexte d'authentification
type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function useProtectedRoute(session: Session | null, profile: Profile | null, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inClientGroup = segments[0] === '(client)';
    const inAgentGroup = segments[0] === '(agent)';
    const isSetupPage = segments[1] === 'setup-profile';
    const isVerifyPage = segments[1] === 'verify';

    if (!session && !inAuthGroup) {
      // Rediriger vers la page de login si non authentifié
      router.replace('/(auth)/login');
    } else if (session && profile) {
      // Check if profile needs completion (no full_name)
      if (!profile.full_name && inAuthGroup && !isSetupPage && !isVerifyPage) {
        router.replace('/(auth)/setup-profile');
        return;
      }

      if (inAuthGroup && !isSetupPage && !isVerifyPage) {
        // Rediriger selon le rôle après authentification
        if (profile.role === 'AGENT') {
          router.replace('/(agent)/dashboard');
        } else {
          router.replace('/(client)/home');
        }
      } else if (profile.role === 'AGENT' && inClientGroup) {
        // Un agent ne peut pas accéder aux pages client
        router.replace('/(agent)/dashboard');
      } else if (profile.role === 'CLIENT' && inAgentGroup) {
        // Un client ne peut pas accéder aux pages agent
        router.replace('/(client)/home');
      }
    }
  }, [session, profile, segments, isLoading]);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Essayer de récupérer le profil existant
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Profil trouvé
        setProfile(data as Profile);
      } else {
        // Profil non trouvé - le créer automatiquement
        console.log('Profil non trouvé, création automatique...');

        // Récupérer les infos de l'utilisateur authentifié
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const phoneNumber = user.phone || user.user_metadata?.phone || '';

          // Utiliser upsert pour éviter les conflits
          const { error: createError } = await (supabase
            .from('profiles') as any)
            .upsert(
              {
                id: userId,
                phone: phoneNumber,
                role: 'CLIENT',
              },
              { onConflict: 'id' }
            );

          if (createError) {
            console.error('Erreur création profil:', createError);
          }

          // Définir le profil localement
          setProfile({
            id: userId,
            phone: phoneNumber,
            role: 'CLIENT',
            full_name: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh profile function exposed via context
  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  // Charger la session et le profil
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  useProtectedRoute(session, profile, isLoading);

  // Afficher le splash animé en premier
  if (showAnimatedSplash) {
    return (
      <AnimatedSplashScreen
        onAnimationFinish={() => setShowAnimatedSplash(false)}
      />
    );
  }

  if (!loaded || isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ session, profile, isLoading, signOut, refreshProfile }}>
      <ToastProvider>
        <RootLayoutNav />
      </ToastProvider>
    </AuthContext.Provider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* StatusBar sombre pour que l'heure et la batterie soient visibles */}
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(client)"
          options={{
            headerShown: false,
            // Désactiver le swipe back quand connecté
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="(agent)"
          options={{
            headerShown: false,
            // Désactiver le swipe back quand connecté
            gestureEnabled: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
