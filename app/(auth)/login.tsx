import { useState, useEffect, useRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Spinner, View, ScrollView } from 'tamagui';
import { Phone, Sparkles } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session, profile, isLoading } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation d'entrée séquentielle
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animation de pulsation continue pour le logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
      const password = `puzzle_${formattedPhone}_temp`;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password: password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            phone: formattedPhone,
            password: password,
            options: {
              data: { phone: formattedPhone }
            }
          });

          if (signUpError) {
            if (signUpError.message.includes('User already registered')) {
              Alert.alert(
                'Compte existant',
                'Ce numéro est déjà enregistré. Contactez le support si vous ne pouvez pas vous connecter.'
              );
            } else {
              throw signUpError;
            }
          } else {
            const { error: loginAfterSignUp } = await supabase.auth.signInWithPassword({
              phone: formattedPhone,
              password: password,
            });
            if (loginAfterSignUp) throw loginAfterSignUp;
            Alert.alert('Bienvenue !', 'Votre compte a été créé avec succès.');
          }
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#0A1628', '#1E3A5F', '#0F2744']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.loadingLogo}>
            <Text style={styles.loadingEmoji}>💊</Text>
          </View>
        </Animated.View>
        <Spinner size="large" color="#00D9FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#0A1628', '#132F4C', '#0A1628']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative elements */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Logo animé */}
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { scale: scaleAnim }
                    ]
                  }
                ]}
              >
                <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }] }]}>
                  <LinearGradient
                    colors={['#00D9FF', '#0EA5E9', '#0284C7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logo}
                  >
                    <Text style={styles.logoEmoji}>💊</Text>
                  </LinearGradient>
                  <View style={styles.logoGlow} />
                </Animated.View>

                <Text style={styles.appName}>PuzzlePharm</Text>
                <View style={styles.taglineContainer}>
                  <Sparkles size={14} color="#00D9FF" />
                  <Text style={styles.tagline}>Vos médicaments, simplement</Text>
                </View>
              </Animated.View>

              {/* Form Card avec glassmorphism */}
              <Animated.View
                style={[
                  styles.formCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.5) }]
                  }
                ]}
              >
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Bienvenue</Text>
                  <Text style={styles.formSubtitle}>
                    Connectez-vous avec votre numéro
                  </Text>
                </View>

                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <View style={styles.countryCode}>
                      <Text style={styles.flag}>🇳🇪</Text>
                      <Text style={styles.countryCodeText}>+227</Text>
                    </View>
                    <View style={styles.inputDivider} />
                    <TextInput
                      style={styles.input}
                      placeholder="90 84 84 24"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <Pressable
                  onPress={handleLogin}
                  disabled={loading || !phone}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && !loading && styles.submitButtonPressed,
                    (!phone || loading) && styles.submitButtonDisabled
                  ]}
                >
                  <LinearGradient
                    colors={phone && !loading ? ['#00D9FF', '#0EA5E9'] : ['#374151', '#374151']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButtonGradient}
                  >
                    {loading ? (
                      <>
                        <Spinner size="small" color="#0A1628" />
                        <Text style={styles.submitButtonText}>Connexion...</Text>
                      </>
                    ) : (
                      <Text style={styles.submitButtonText}>Continuer</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              {/* Footer */}
              <Animated.View style={[styles.footerContainer, { opacity: fadeAnim }]}>
                <Text style={styles.footer}>
                  En continuant, vous acceptez nos{' '}
                  <Text style={styles.footerLink}>conditions d'utilisation</Text>
                </Text>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  loadingEmoji: {
    fontSize: 36,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  // Decorative circles
  decorCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 217, 255, 0.03)',
    top: -100,
    right: -100,
  },
  decorCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    bottom: 100,
    left: -80,
  },
  decorCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 217, 255, 0.02)',
    top: height * 0.4,
    right: -50,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#00D9FF',
    opacity: 0.3,
    top: 0,
    left: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#00D9FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
      },
    }),
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  // Form Card - Glassmorphism
  formCard: {
    backgroundColor: Platform.OS === 'android' ? '#1E293B' : 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: Platform.OS === 'android' ? 2 : 1,
    borderColor: Platform.OS === 'android' ? '#00D9FF' : 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: Platform.OS === 'android' ? '#94A3B8' : 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },

  // Input
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? '#0F172A' : 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Platform.OS === 'android' ? '#334155' : 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: Platform.OS === 'android' ? '#1E293B' : 'transparent',
  },
  flag: {
    fontSize: 22,
  },
  countryCodeText: {
    fontSize: 16,
    color: Platform.OS === 'android' ? '#E2E8F0' : 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  inputDivider: {
    width: 2,
    height: 32,
    backgroundColor: Platform.OS === 'android' ? '#334155' : 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Submit Button
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A1628',
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 20,
  },
  footerLink: {
    color: '#00D9FF',
    fontWeight: '500',
  },
});
