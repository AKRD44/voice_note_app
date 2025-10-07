/**
 * Protected Route Component
 * Wraps components that require authentication
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Protected Route HOC
 * Redirects to login if user is not authenticated
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = 'Login',
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login screen
      (navigation as any).replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, navigation, redirectTo]);

  // Show loading state
  if (isLoading) {
    return fallback || (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Show protected content
  return <>{children}</>;
};

/**
 * HOC to wrap a component with authentication protection
 */
export function withAuthProtection<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook to check if user has required subscription tier
 */
export const useRequiresPremium = () => {
  const { profile } = useAuth();

  return React.useCallback(
    (onNotPremium?: () => void): boolean => {
      const isPremium = profile?.subscription_tier === 'premium';

      if (!isPremium && onNotPremium) {
        onNotPremium();
      }

      return isPremium;
    },
    [profile]
  );
};

/**
 * Component to gate premium features
 */
interface PremiumGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgradePress?: () => void;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  fallback,
  onUpgradePress,
}) => {
  const { profile } = useAuth();
  const isPremium = profile?.subscription_tier === 'premium';

  if (!isPremium) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
});

export default ProtectedRoute;

