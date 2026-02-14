/**
 * Toast Component
 * In-app toast notifications with variants
 */
import React, { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const toastConfig = {
  success: {
    icon: CheckCircle,
    backgroundColor: colors.success.light,
    borderColor: colors.success.primary,
    iconColor: colors.success.primary,
    textColor: colors.success.secondary,
  },
  error: {
    icon: AlertCircle,
    backgroundColor: colors.error.light,
    borderColor: colors.error.primary,
    iconColor: colors.error.primary,
    textColor: colors.error.secondary,
  },
  info: {
    icon: Info,
    backgroundColor: colors.info.light,
    borderColor: colors.info.primary,
    iconColor: colors.info.primary,
    textColor: colors.info.secondary,
  },
  warning: {
    icon: AlertCircle,
    backgroundColor: colors.warning.light,
    borderColor: colors.warning.primary,
    iconColor: colors.warning.primary,
    textColor: colors.warning.secondary,
  },
};

interface ToastProps extends ToastConfig {
  visible: boolean;
  onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  duration = 3000,
  action,
  visible,
  onHide,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          onHide();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, duration, onHide, translateY, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + spacing.md,
          transform: [{ translateY }],
          opacity,
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon size={22} color={config.iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.textColor }]}>{title}</Text>
          {message && (
            <Text style={[styles.message, { color: config.textColor }]}>{message}</Text>
          )}
        </View>
        {action ? (
          <Pressable onPress={action.onPress} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: config.iconColor }]}>
              {action.label}
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={onHide} style={styles.closeButton}>
            <X size={18} color={config.iconColor} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((config: ToastConfig) => {
    setToast(config);
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
    setTimeout(() => setToast(null), 300);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          {...toast}
          visible={visible}
          onHide={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.label,
    marginBottom: 2,
  },
  message: {
    ...typography.bodySmall,
    opacity: 0.8,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  actionText: {
    ...typography.label,
    fontSize: 13,
  },
});

export default Toast;

