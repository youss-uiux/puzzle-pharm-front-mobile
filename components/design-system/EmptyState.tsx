/**
 * Empty State Component
 * Reusable empty state with icon, title, description, and CTA
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FileText, Search, Inbox, Package, MapPin } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { Button } from './Button';

type EmptyStateVariant = 'default' | 'search' | 'history' | 'pharmacies' | 'demandes';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

const variantConfig = {
  default: {
    icon: Inbox,
    title: 'Rien à afficher',
    description: 'Les éléments apparaîtront ici.',
  },
  search: {
    icon: Search,
    title: 'Aucun résultat',
    description: 'Essayez une autre recherche.',
  },
  history: {
    icon: FileText,
    title: 'Aucune demande',
    description: 'Vos recherches de médicaments apparaîtront ici.',
  },
  pharmacies: {
    icon: MapPin,
    title: 'Aucune pharmacie',
    description: 'Les pharmacies de garde apparaîtront ici.',
  },
  demandes: {
    icon: Package,
    title: 'Aucune demande',
    description: 'Les nouvelles demandes apparaîtront ici.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}) => {
  const config = variantConfig[variant];
  const IconComponent = config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        {React.isValidElement(icon) ? (
          icon
        ) : (
          <IconComponent size={48} color={colors.text.tertiary} strokeWidth={1.5} />
        )}
      </View>
      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.description}>{displayDescription}</Text>
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="medium"
          />
        </View>
      )}
    </View>
  );
};

// Inline Empty State - smaller version for lists
interface InlineEmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export const InlineEmptyState: React.FC<InlineEmptyStateProps> = ({
  message,
  icon,
}) => {
  return (
    <View style={styles.inlineContainer}>
      {icon && <View style={styles.inlineIcon}>{icon}</View>}
      <Text style={styles.inlineText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: spacing.xl,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  inlineIcon: {
    marginRight: spacing.sm,
  },
  inlineText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
});

export default EmptyState;

