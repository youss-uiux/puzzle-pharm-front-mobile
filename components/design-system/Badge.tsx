/**
 * Badge Component
 * Notification badge for tab bar and other uses
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, radius } from '../../constants/theme';

interface BadgeProps {
  count?: number;
  maxCount?: number;
  visible?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  count = 0,
  maxCount = 99,
  visible = true,
  size = 'medium',
  color = colors.error.primary,
  style,
  dot = false,
}) => {
  if (!visible || (count === 0 && !dot)) return null;

  const sizeStyles = {
    small: {
      minWidth: dot ? 8 : 16,
      height: dot ? 8 : 16,
      fontSize: 10,
      paddingHorizontal: dot ? 0 : 4,
    },
    medium: {
      minWidth: dot ? 10 : 20,
      height: dot ? 10 : 20,
      fontSize: 11,
      paddingHorizontal: dot ? 0 : 6,
    },
    large: {
      minWidth: dot ? 12 : 24,
      height: dot ? 12 : 24,
      fontSize: 12,
      paddingHorizontal: dot ? 0 : 8,
    },
  };

  const currentSize = sizeStyles[size];
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <View
      style={[
        styles.badge,
        {
          minWidth: currentSize.minWidth,
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          backgroundColor: color,
          borderRadius: currentSize.height / 2,
        },
        style,
      ]}
    >
      {!dot && (
        <Text
          style={[
            styles.text,
            { fontSize: currentSize.fontSize },
          ]}
        >
          {displayCount}
        </Text>
      )}
    </View>
  );
};

// Tab Bar Badge - positioned for tab icons
interface TabBadgeProps extends BadgeProps {
  offset?: { top?: number; right?: number };
}

export const TabBadge: React.FC<TabBadgeProps> = ({
  offset = { top: -4, right: -8 },
  ...props
}) => {
  return (
    <Badge
      {...props}
      style={[
        styles.tabBadge,
        {
          top: offset.top,
          right: offset.right,
        },
        props.style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface.primary,
  },
  text: {
    color: colors.text.inverse,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabBadge: {
    position: 'absolute',
  },
});

export default Badge;

