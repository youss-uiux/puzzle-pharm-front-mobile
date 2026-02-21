/**
 * Custom Animated Splash Screen
 * Logo qui bounce avant le chargement de l'app
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onAnimationFinish?: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationFinish,
}) => {
  // Animations
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Séquence d'animation
    Animated.sequence([
      // 1. Fade in + Scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),

      // 2. Bounce (3 rebonds)
      Animated.sequence([
        // Premier bounce
        Animated.spring(bounceAnim, {
          toValue: -30,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),

        // Deuxième bounce (plus petit)
        Animated.spring(bounceAnim, {
          toValue: -20,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),

        // Troisième bounce (encore plus petit)
        Animated.spring(bounceAnim, {
          toValue: -10,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),

      // 3. Petit délai avant de continuer
      Animated.delay(300),

      // 4. Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animation terminée, on peut charger l'app
      if (onAnimationFinish) {
        onAnimationFinish();
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: bounceAnim },
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/images/logo-splash-screen.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.5,
    height: height * 0.3,
  },
});

export default AnimatedSplashScreen;

