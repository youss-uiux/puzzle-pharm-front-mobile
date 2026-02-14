/**
 * Product Card Component
 * Modern Apothecary Design System - Premium medicine card with organic framing
 */
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Package, ChevronRight } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
import { OrganicShape } from './OrganicShapes';

interface ProductCardProps {
  name: string;
  description?: string;
  dosage?: string;
  price?: string;
  image?: ImageSourcePropType;
  pharmacyName?: string;
  available?: boolean;
  onPress?: () => void;
  variant?: 'compact' | 'expanded';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  description,
  dosage,
  price,
  image,
  pharmacyName,
  available = true,
  onPress,
  variant = 'compact',
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      damping: 15,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  if (variant === 'expanded') {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
      >
        <Animated.View
          style={[
            styles.expandedCard,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Image Section with Organic Frame */}
          <View style={styles.expandedImageContainer}>
            <OrganicShape
              variant="arch"
              size={200}
              color={colors.accent.primary}
              opacity={0.15}
              style={styles.imageDecor}
            />
            {image ? (
              <Image source={image} style={styles.expandedImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholderIcon}>
                <Package size={48} color={colors.text.tertiary} />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.expandedContent}>
            <Text style={styles.expandedName} numberOfLines={2}>
              {name}
            </Text>

            {dosage && (
              <View style={styles.dosageBadge}>
                <Text style={styles.dosageText}>{dosage}</Text>
              </View>
            )}

            {description && (
              <Text style={styles.expandedDescription} numberOfLines={2}>
                {description}
              </Text>
            )}

            <View style={styles.expandedFooter}>
              {price && (
                <Text style={styles.priceText}>{price}</Text>
              )}
              {pharmacyName && (
                <Text style={styles.pharmacyText}>{pharmacyName}</Text>
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  // Compact variant
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          styles.compactCard,
          !available && styles.cardUnavailable,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Image */}
        <View style={styles.compactImageContainer}>
          {image ? (
            <Image source={image} style={styles.compactImage} resizeMode="contain" />
          ) : (
            <View style={styles.compactPlaceholder}>
              <Package size={24} color={colors.text.tertiary} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>
            {name}
          </Text>
          {dosage && (
            <Text style={styles.compactDosage}>{dosage}</Text>
          )}
          {pharmacyName && (
            <Text style={styles.compactPharmacy} numberOfLines={1}>
              {pharmacyName}
            </Text>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.compactRight}>
          {!available && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>Indisponible</Text>
            </View>
          )}
          {available && price && (
            <Text style={styles.compactPrice}>{price}</Text>
          )}
          {onPress && (
            <ChevronRight size={20} color={colors.text.tertiary} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

// Product Detail Header Component
interface ProductDetailHeaderProps {
  name: string;
  dosage?: string;
  manufacturer?: string;
  image?: ImageSourcePropType;
}

export const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({
  name,
  dosage,
  manufacturer,
  image,
}) => {
  return (
    <View style={styles.detailHeader}>
      {/* Background Decoration */}
      <View style={styles.detailDecor}>
        <OrganicShape
          variant="arch"
          size={400}
          color={colors.accent.primary}
          opacity={0.12}
          style={styles.detailArchDecor}
        />
      </View>

      {/* Image */}
      <View style={styles.detailImageContainer}>
        {image ? (
          <Image source={image} style={styles.detailImage} resizeMode="contain" />
        ) : (
          <View style={styles.detailPlaceholder}>
            <Package size={64} color={colors.text.tertiary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.detailInfo}>
        <Text style={styles.detailName}>{name}</Text>
        {dosage && (
          <View style={styles.detailDosageBadge}>
            <Text style={styles.detailDosageText}>{dosage}</Text>
          </View>
        )}
        {manufacturer && (
          <Text style={styles.detailManufacturer}>{manufacturer}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Expanded Card
  expandedCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.md,
  },
  expandedImageContainer: {
    height: 180,
    backgroundColor: colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageDecor: {
    position: 'absolute',
    bottom: -50,
    left: '50%',
    marginLeft: -100,
  },
  expandedImage: {
    width: 120,
    height: 120,
  },
  placeholderIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    padding: spacing.lg,
  },
  expandedName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  dosageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  dosageText: {
    ...typography.label,
    color: colors.accent.secondary,
  },
  expandedDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  expandedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    ...typography.h4,
    color: colors.accent.primary,
  },
  pharmacyText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Compact Card
  compactCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  cardUnavailable: {
    opacity: 0.6,
  },
  compactImageContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  compactImage: {
    width: 40,
    height: 40,
  },
  compactPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactName: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: 2,
  },
  compactDosage: {
    ...typography.caption,
    color: colors.accent.secondary,
    marginBottom: 2,
  },
  compactPharmacy: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  compactRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  compactPrice: {
    ...typography.label,
    color: colors.accent.primary,
  },
  unavailableBadge: {
    backgroundColor: colors.error.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  unavailableText: {
    ...typography.caption,
    color: colors.error.primary,
    fontSize: 10,
  },

  // Detail Header
  detailHeader: {
    backgroundColor: colors.surface.primary,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  detailDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  detailArchDecor: {
    position: 'absolute',
    top: -150,
    left: '50%',
    marginLeft: -200,
  },
  detailImageContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailImage: {
    width: 150,
    height: 150,
  },
  detailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  detailName: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  detailDosageBadge: {
    backgroundColor: colors.accent.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  detailDosageText: {
    ...typography.label,
    color: colors.accent.secondary,
  },
  detailManufacturer: {
    ...typography.body,
    color: colors.text.tertiary,
  },
});

export default ProductCard;

