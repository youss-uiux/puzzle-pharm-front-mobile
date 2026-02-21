/**
 * Organic Shapes Component
 * Background decorations for Modern Apothecary - Lightweight version
 */
import React, { memo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

interface OrganicShapeProps {
  variant: 'circle' | 'arch' | 'blob' | 'ring';
  size?: number;
  color?: string;
  opacity?: number;
  style?: ViewStyle;
}

// Version simplifiée avec des formes CSS au lieu de SVG complexes
export const OrganicShape: React.FC<OrganicShapeProps> = memo(({
  variant,
  size = 200,
  color = colors.accent.primary,
  opacity = 0.08,
  style,
}) => {
  const getShapeStyle = () => {
    const baseStyle = {
      width: size,
      height: variant === 'arch' ? size * 0.6 : size,
      backgroundColor: color,
      opacity,
    };

    switch (variant) {
      case 'circle':
        return { ...baseStyle, borderRadius: size / 2 };
      case 'ring':
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 20,
          borderColor: color,
          backgroundColor: 'transparent',
          opacity,
        };
      case 'arch':
        return {
          ...baseStyle,
          borderTopLeftRadius: size / 2,
          borderTopRightRadius: size / 2,
        };
      case 'blob':
        return {
          ...baseStyle,
          borderRadius: size / 3,
          transform: [{ rotate: '45deg' }],
        };
      default:
        return baseStyle;
    }
  };

  return <View style={[styles.container, style, getShapeStyle()]} />;
});

// Pre-configured background layouts - Simplified
interface BackgroundShapesProps {
  variant?: 'home' | 'search' | 'profile' | 'detail';
}

export const BackgroundShapes: React.FC<BackgroundShapesProps> = memo(({
  variant = 'home',
}) => {
  // Version simplifiée avec moins d'éléments pour optimiser les performances
  const renderVariant = () => {
    switch (variant) {
      case 'home':
        return (
          <>
            <OrganicShape
              variant="circle"
              size={300}
              color={colors.accent.primary}
              opacity={0.03}
              style={styles.homeCircle1}
            />
          </>
        );

      case 'search':
        return (
          <>
            <OrganicShape
              variant="circle"
              size={200}
              color={colors.info.primary}
              opacity={0.02}
              style={styles.searchCircle}
            />
          </>
        );

      case 'profile':
        return (
          <>
            <OrganicShape
              variant="arch"
              size={350}
              color={colors.accent.primary}
              opacity={0.03}
              style={styles.profileArch}
            />
          </>
        );

      case 'detail':
        return (
          <>
            <OrganicShape
              variant="arch"
              size={400}
              color={colors.accent.primary}
              opacity={0.04}
              style={styles.detailArch}
            />
          </>
        );

      default:
        return null;
    }
  };

  return <View style={styles.backgroundContainer}>{renderVariant()}</View>;
});

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

