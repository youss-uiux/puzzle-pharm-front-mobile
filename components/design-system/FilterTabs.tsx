/**
 * Filter Tabs Component
 * Horizontal scrollable filter tabs with badge support
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { Badge } from './Badge';

export interface FilterTab {
  key: string;
  label: string;
  count?: number;
  showBadge?: boolean;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  style?: ViewStyle;
  scrollable?: boolean;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  style,
  scrollable = true,
}) => {
  const renderTabs = () => (
    <>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[
              styles.tab,
              isActive && styles.tabActive,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label}${tab.count !== undefined ? `, ${tab.count} éléments` : ''}`}
          >
            <Text
              style={[
                styles.tabText,
                isActive && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={[
                styles.countBadge,
                isActive && styles.countBadgeActive,
              ]}>
                <Text style={[
                  styles.countText,
                  isActive && styles.countTextActive,
                ]}>
                  {tab.count > 99 ? '99+' : tab.count}
                </Text>
              </View>
            )}
            {tab.showBadge && (
              <Badge
                dot
                size="small"
                color={isActive ? colors.surface.primary : colors.error.primary}
                style={styles.notificationDot}
              />
            )}
          </Pressable>
        );
      })}
    </>
  );

  if (scrollable) {
    return (
      <View style={[styles.container, style]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderTabs()}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.flexContainer, style]}>
      {renderTabs()}
    </View>
  );
};

// Status Tabs - pre-configured for demande statuses
interface StatusTabsProps {
  activeStatus: string;
  onStatusChange: (status: string) => void;
  counts?: {
    all?: number;
    en_attente?: number;
    en_cours?: number;
    traite?: number;
  };
  showAll?: boolean;
  style?: ViewStyle;
}

export const StatusTabs: React.FC<StatusTabsProps> = ({
  activeStatus,
  onStatusChange,
  counts = {},
  showAll = true,
  style,
}) => {
  const tabs: FilterTab[] = [
    ...(showAll ? [{ key: 'all', label: 'Toutes', count: counts.all }] : []),
    { key: 'en_attente', label: 'En attente', count: counts.en_attente },
    { key: 'en_cours', label: 'En cours', count: counts.en_cours },
    { key: 'traite', label: 'Traitées', count: counts.traite },
  ];

  return (
    <FilterTabs
      tabs={tabs}
      activeTab={activeStatus}
      onTabChange={onStatusChange}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  flexContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  tabActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  tabText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.primary,
  },
  countBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(26, 26, 26, 0.15)',
  },
  countText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  countTextActive: {
    color: colors.text.primary,
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
});

export default FilterTabs;

