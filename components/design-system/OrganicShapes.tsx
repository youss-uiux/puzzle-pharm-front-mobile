/**
 * Organic Shapes Component
 * Background decorations for Modern Apothecary - Arches, circles, and organic forms
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../constants/theme';

interface OrganicShapeProps {
  variant: 'circle' | 'arch' | 'blob' | 'ring';
  size?: number;
  color?: string;
  opacity?: number;
  style?: ViewStyle;
}

export const OrganicShape: React.FC<OrganicShapeProps> = ({
  variant,
  size = 200,
  color = colors.accent.primary,
  opacity = 0.08,
  style,
}) => {
  const renderShape = () => {
    switch (variant) {
      case 'circle':
        return (
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Defs>
              <LinearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
                <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.3} />
              </LinearGradient>
            </Defs>
            <Circle cx="100" cy="100" r="100" fill="url(#circleGrad)" />
          </Svg>
        );

      case 'arch':
        return (
          <Svg width={size} height={size * 0.6} viewBox="0 0 200 120">
            <Defs>
              <LinearGradient id="archGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
                <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.3} />
              </LinearGradient>
            </Defs>
            <Path
              d="M0 120 L0 60 Q0 0 100 0 Q200 0 200 60 L200 120 Z"
              fill="url(#archGrad)"
            />
          </Svg>
        );

      case 'blob':
        return (
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Defs>
              <LinearGradient id="blobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
                <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.3} />
              </LinearGradient>
            </Defs>
            <Path
              d="M100 0 Q150 20 180 60 Q200 100 180 140 Q150 180 100 200 Q50 180 20 140 Q0 100 20 60 Q50 20 100 0 Z"
              fill="url(#blobGrad)"
            />
          </Svg>
        );

      case 'ring':
        return (
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Defs>
              <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
                <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.5} />
              </LinearGradient>
            </Defs>
            <Circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="20"
            />
          </Svg>
        );

      default:
        return null;
    }
  };

  return <View style={[styles.container, style]}>{renderShape()}</View>;
};

// Pre-configured background layouts
interface BackgroundShapesProps {
  variant?: 'home' | 'search' | 'profile' | 'detail';
}

export const BackgroundShapes: React.FC<BackgroundShapesProps> = ({
  variant = 'home',
}) => {
  const renderVariant = () => {
    switch (variant) {
      case 'home':
        return (
          <>
            <OrganicShape
              variant="circle"
              size={350}
              color={colors.accent.primary}
              opacity={0.04}
              style={styles.homeCircle1}
            />
            <OrganicShape
              variant="arch"
              size={280}
              color={colors.success.primary}
              opacity={0.03}
              style={styles.homeArch}
            />
            <OrganicShape
              variant="ring"
              size={200}
              color={colors.accent.primary}
              opacity={0.03}
              style={styles.homeRing}
            />
          </>
        );

      case 'search':
        return (
          <>
            <OrganicShape
              variant="blob"
              size={320}
              color={colors.accent.primary}
              opacity={0.03}
              style={styles.searchBlob1}
            />
            <OrganicShape
              variant="circle"
              size={180}
              color={colors.info.primary}
              opacity={0.025}
              style={styles.searchCircle}
            />
          </>
        );

      case 'profile':
        return (
          <>
            <OrganicShape
              variant="arch"
              size={400}
              color={colors.accent.primary}
              opacity={0.05}
              style={styles.profileArch}
            />
            <OrganicShape
              variant="ring"
              size={220}
              color={colors.success.primary}
              opacity={0.025}
              style={styles.profileRing}
            />
          </>
        );

      case 'detail':
        return (
          <>
            <OrganicShape
              variant="arch"
              size={450}
              color={colors.accent.primary}
              opacity={0.08}
              style={styles.detailArch}
            />
            <OrganicShape
              variant="circle"
              size={140}
              color={colors.accent.secondary}
              opacity={0.04}
              style={styles.detailCircle}
            />
          </>
        );

      default:
        return null;
    }
  };

  return <View style={styles.backgroundContainer}>{renderVariant()}</View>;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },

  // Home variant positions
  homeCircle1: {
    top: -100,
    right: -100,
  },
  homeArch: {
    bottom: 150,
    left: -80,
    transform: [{ rotate: '-15deg' }],
  },
  homeRing: {
    top: 200,
    right: -60,
  },

  // Search variant positions
  searchBlob1: {
    top: 80,
    right: -100,
    transform: [{ rotate: '45deg' }],
  },
  searchCircle: {
    bottom: 200,
    left: -50,
  },

  // Profile variant positions
  profileArch: {
    top: -120,
    left: '50%',
    marginLeft: -175,
  },
  profileRing: {
    bottom: 100,
    right: -80,
  },

  // Detail variant positions
  detailArch: {
    top: -200,
    left: '50%',
    marginLeft: -200,
  },
  detailCircle: {
    bottom: 300,
    left: 20,
  },
});

export default OrganicShape;

