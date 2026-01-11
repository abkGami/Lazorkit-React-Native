/**
 * AuthenticationScreen.tsx
 *
 * Main authentication flow for Lazorkit passkey authentication.
 * Handles user onboarding with FaceID/TouchID biometric login.
 *
 * Features:
 * - Biometric passkey creation
 * - Session management
 * - Error handling and recovery
 * - Beautiful UI/UX for wallet onboarding
 */

import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const APP_SCHEME = "lazorkit://";

interface AuthState {
  step: "welcome" | "biometric" | "creating" | "success";
  isProcessing: boolean;
  error: string | null;
}

/**
 * AuthenticationScreen Component
 *
 * Guides users through the passkey creation and authentication process.
 * Uses device biometrics (FaceID/TouchID) for secure, passwordless login.
 */
export const AuthenticationScreen: React.FC = () => {
  const { connect } = useWallet();
  const [authState, setAuthState] = useState<AuthState>({
    step: "welcome",
    isProcessing: false,
    error: null,
  });

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  /**
   * Animate button press
   */
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Start biometric icon animation
   */
  React.useEffect(() => {
    if (authState.step === "biometric") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      opacityAnim.setValue(1);
    }
  }, [authState.step, opacityAnim]);

  /**
   * Handle passkey creation and wallet connection
   */
  const handleCreatePasskey = useCallback(async () => {
    animatePress();
    setAuthState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Step 1: Create passkey with biometric
      setAuthState((prev) => ({ ...prev, step: "biometric" }));
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate biometric prompt

      // Step 2: Creating wallet
      setAuthState((prev) => ({ ...prev, step: "creating" }));

      // Connect wallet using Lazorkit SDK with proper callbacks
      await connect({
        redirectUrl: APP_SCHEME,
        onSuccess: (wallet) => {
          console.log("Wallet connected successfully:", wallet.smartWallet);
          setAuthState((prev) => ({
            ...prev,
            step: "success",
            isProcessing: false,
          }));
        },
        onFail: (err) => {
          throw err;
        },
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Authentication failed";
      setAuthState((prev) => ({
        ...prev,
        isProcessing: false,
        error: errorMsg,
        step: "welcome",
      }));

      Alert.alert("Authentication Failed", errorMsg);
    }
  }, [connect]);

  /**
   * Handle restore from existing passkey
   */
  const handleRestoreWallet = useCallback(async () => {
    animatePress();
    setAuthState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      setAuthState((prev) => ({ ...prev, step: "biometric" }));
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate biometric

      await connect({
        redirectUrl: APP_SCHEME,
        onSuccess: (wallet) => {
          console.log("Wallet restored successfully:", wallet.smartWallet);
          setAuthState((prev) => ({
            ...prev,
            step: "success",
            isProcessing: false,
          }));
        },
        onFail: (err) => {
          throw err;
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Restore failed";
      setAuthState((prev) => ({
        ...prev,
        isProcessing: false,
        error: errorMsg,
        step: "welcome",
      }));

      Alert.alert("Restore Failed", errorMsg);
    }
  }, [connect]);

  const renderContent = () => {
    switch (authState.step) {
      case "welcome":
        return (
          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.mainTitle}>Welcome to Lazorkit</Text>
              <Text style={styles.subtitle}>Passwordless Solana Wallet</Text>
            </View>

            <View style={styles.featureContainer}>
              <Feature
                icon="finger-print"
                title="Biometric Security"
                description="Secured by FaceID, TouchID, or Windows Hello"
              />
              <Feature
                icon="flash"
                title="Gasless Transactions"
                description="Pay with any token, we sponsor the network fee"
              />
              <Feature
                icon="shield-checkmark"
                title="No Seed Phrase"
                description="Your keys never leave your device"
              />
            </View>

            <View style={styles.buttonContainer}>
              <Animated.View
                style={[
                  styles.primaryButtonAnimated,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleCreatePasskey}
                  disabled={authState.isProcessing}
                  activeOpacity={0.8}
                >
                  {authState.isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" size="large" />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>
                        Create New Wallet
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleRestoreWallet}
                disabled={authState.isProcessing}
                activeOpacity={0.7}
              >
                <Ionicons name="key" size={20} color="#6366F1" />
                <Text style={styles.secondaryButtonText}>Restore Wallet</Text>
              </TouchableOpacity>
            </View>

            {authState.error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{authState.error}</Text>
              </View>
            )}
          </View>
        );

      case "biometric":
        return (
          <View style={styles.contentContainer}>
            <View style={styles.processingContainer}>
              <Animated.View
                style={[
                  styles.biometricIcon,
                  {
                    opacity: opacityAnim,
                  },
                ]}
              >
                <Ionicons name="finger-print" size={80} color="#6366F1" />
              </Animated.View>
              <Text style={styles.processingTitle}>Verify with Biometrics</Text>
              <Text style={styles.processingSubtitle}>
                Use your fingerprint or face to verify your identity
              </Text>
              <ActivityIndicator
                size="large"
                color="#6366F1"
                style={styles.loader}
              />
            </View>
          </View>
        );

      case "creating":
        return (
          <View style={styles.contentContainer}>
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.processingTitle}>Creating Your Wallet</Text>
              <Text style={styles.processingSubtitle}>
                Setting up your smart account on Solana...
              </Text>
            </View>
          </View>
        );

      case "success":
        return (
          <View style={styles.contentContainer}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Wallet Created!</Text>
              <Text style={styles.successSubtitle}>
                Your Lazorkit wallet is ready to use
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>{renderContent()}</SafeAreaView>
  );
};

/**
 * Feature Component
 *
 * Displays a feature card with icon, title, and description
 */
const Feature: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon as any} size={24} color="#6366F1" />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: "space-between",
  },
  headerContainer: {
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  featureContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButtonAnimated: {
    borderRadius: 12,
    overflow: "hidden",
  },
  primaryButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#6366F1",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  biometricIcon: {
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
    marginTop: 24,
  },
  processingSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  loader: {
    marginTop: 24,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});
