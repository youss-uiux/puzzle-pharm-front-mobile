/**
 * Skeleton Loader Component
 * Animated shimmer skeleton for loading states
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = radius.sm,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Convert width to a valid type for Animated.View
  const animatedWidth = typeof width === 'string' ? width as `${number}%` : width;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: animatedWidth,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton Card for demandes/pharmacies lists
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={radius.md} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="70%" height={18} style={styles.mb8} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
      <Skeleton width="90%" height={14} style={styles.mt12} />
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={28} borderRadius={radius.sm} />
        <Skeleton width={48} height={48} borderRadius={radius.md} />
      </View>
    </View>
  );
};

// Skeleton for Bento Grid
export const SkeletonBento: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.bentoCard, style]}>
      <Skeleton width={48} height={48} borderRadius={radius.md} style={styles.mb12} />
      <Skeleton width="60%" height={18} style={styles.mb8} />
      <Skeleton width="40%" height={14} />
    </View>
  );
};

// Skeleton for Stats Grid
export const SkeletonStats: React.FC = () => {
  return (
    <View style={styles.statsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.statCard}>
          <Skeleton width={44} height={44} borderRadius={radius.md} style={styles.mb12} />
          <Skeleton width={50} height={32} style={styles.mb8} />
          <Skeleton width={70} height={14} />
        </View>
      ))}
    </View>
  );
};

// Skeleton for Profile Card
export const SkeletonProfile: React.FC = () => {
  return (
    <View style={styles.profileCard}>
      <Skeleton width={72} height={72} borderRadius={radius.avatar || 24} />
      <View style={styles.profileInfo}>
        <Skeleton width={140} height={22} style={styles.mb8} />
        <Skeleton width={100} height={14} style={styles.mb12} />
        <Skeleton width={80} height={24} borderRadius={radius.pill} />
      </View>
    </View>
  );
};

// Full screen skeleton list
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={i < count - 1 ? styles.mb16 : undefined} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border.medium,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.lg,
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.lg,
    minHeight: 130,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  profileCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
  mb16: {
    marginBottom: 16,
  },
  mt12: {
    marginTop: 12,
  },
});

export default Skeleton;

