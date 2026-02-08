import { useState, useRef, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Pressable,
  TextInput,
  Animated
} from 'react-native';
import { ScrollView, Spinner, View } from 'tamagui';
import { Search as SearchIcon, Send, CheckCircle, Sparkles, Pill } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SearchScreen() {
  const { session } = useAuth();
  const [medicament, setMedicament] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const successScale = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (success) {
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      successScale.setValue(0);
    }
  }, [success]);

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
      const { error } = await (supabase
        .from('demandes') as any)
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

      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer la demande');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#0A1628', '#132F4C', '#0A1628']}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successContent,
              { transform: [{ scale: successScale }] }
            ]}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.successIcon}
            >
              <CheckCircle size={48} color="#FFFFFF" />
            </LinearGradient>

            <Text style={styles.successTitle}>Demande envoyée !</Text>
            <Text style={styles.successText}>
              Notre équipe recherche votre médicament.{'\n'}
              Vous serez notifié dès qu'une réponse arrive.
            </Text>

            <Pressable
              onPress={() => setSuccess(false)}
              style={({ pressed }) => [
                styles.successButton,
                pressed && styles.successButtonPressed
              ]}
            >
              <LinearGradient
                colors={['#00D9FF', '#0EA5E9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successButtonGradient}
              >
                <Text style={styles.successButtonText}>Nouvelle recherche</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0A1628', '#132F4C', '#0A1628']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

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
                <View style={styles.headerIconContainer}>
                  <LinearGradient
                    colors={['#00D9FF', '#0EA5E9']}
                    style={styles.headerIcon}
                  >
                    <Pill size={20} color="#0A1628" />
                  </LinearGradient>
                </View>
                <Text style={styles.headerTitle}>Rechercher</Text>
                <Text style={styles.headerSubtitle}>
                  Décrivez le médicament que vous cherchez
                </Text>
              </Animated.View>

              {/* Form */}
              <Animated.View
                style={[
                  styles.formCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.3) }]
                  }
                ]}
              >
                {/* Nom du médicament */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Nom du médicament <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <SearchIcon size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Doliprane 1000mg..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={medicament}
                      onChangeText={setMedicament}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.labelOptional}>Détails (optionnel)</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Dosage, forme, marque..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </Animated.View>

              {/* Info */}
              <Animated.View
                style={[
                  styles.infoCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.5) }]
                  }
                ]}
              >
                <Sparkles size={18} color="#00D9FF" />
                <Text style={styles.infoText}>
                  Notre équipe vous répond en temps réel avec les pharmacies disponibles.
                </Text>
              </Animated.View>

              {/* Submit Button */}
              <Animated.View
                style={[
                  styles.buttonContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.multiply(slideAnim, 1.7) }]
                  }
                ]}
              >
                <Pressable
                  onPress={submitDemande}
                  disabled={loading || !medicament.trim()}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && !loading && styles.submitButtonPressed,
                    (!medicament.trim() || loading) && styles.submitButtonDisabled
                  ]}
                >
                  <LinearGradient
                    colors={medicament.trim() && !loading ? ['#00D9FF', '#0EA5E9'] : ['#374151', '#374151']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButtonGradient}
                  >
                    {loading ? (
                      <>
                        <Spinner size="small" color="#0A1628" />
                        <Text style={styles.submitButtonText}>Envoi...</Text>
                      </>
                    ) : (
                      <>
                        <Send size={20} color="#0A1628" />
                        <Text style={styles.submitButtonText}>Envoyer la demande</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
    flexGrow: 1,
  },

  // Decorative
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 217, 255, 0.03)',
    top: 100,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    bottom: 200,
    left: -40,
  },

  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  // Form
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  labelOptional: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    height: 54,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 120,
    fontWeight: '500',
  },

  // Info
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#00D9FF',
    lineHeight: 20,
  },

  // Button Container
  buttonContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
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

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successContent: {
    alignItems: 'center',
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
  },
  successButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  successButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  successButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1628',
  },
});
