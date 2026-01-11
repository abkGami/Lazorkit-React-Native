/**
 * SendTokensModal.tsx
 *
 * Modal component for sending tokens using Lazorkit SDK
 * Supports gasless transactions with biometric authentication
 */

import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const APP_SCHEME = "lazorkit://wallet";

interface SendTokensModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (signature: string) => void;
}

export const SendTokensModal: React.FC<SendTokensModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token] = useState("SOL"); // Currently only SOL, can be expanded
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateRecipient = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleSend = async () => {
    setError(null);

    // Validation
    if (!recipient.trim()) {
      setError("Please enter a recipient address");
      return;
    }

    if (!validateRecipient(recipient)) {
      setError("Invalid recipient address");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!smartWalletPubkey) {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    try {
      // Create transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: new PublicKey(recipient),
        lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
      });

      // Sign and send transaction using Lazorkit SDK
      const signature = await signAndSendTransaction(
        {
          instructions: [transferInstruction],
          transactionOptions: {
            feeToken: "USDC", // Use gasless transaction with USDC
            clusterSimulation: "devnet",
          },
        },
        {
          redirectUrl: `${APP_SCHEME}/send-complete`,
          onSuccess: (sig) => {
            console.log("Transaction successful:", sig);
            Alert.alert(
              "Transaction Sent",
              `Successfully sent ${amount} ${token}\n\nSignature: ${sig.slice(
                0,
                8
              )}...`,
              [
                {
                  text: "OK",
                  onPress: () => {
                    onSuccess?.(sig);
                    handleClose();
                  },
                },
              ]
            );
          },
          onFail: (err) => {
            throw err;
          },
        }
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Transaction failed";
      setError(errorMsg);
      Alert.alert("Transaction Failed", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRecipient("");
    setAmount("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send {token}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Recipient Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Solana address"
                  placeholderTextColor="#9CA3AF"
                  value={recipient}
                  onChangeText={setRecipient}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount ({token})</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="logo-usd" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.tokenBadge}>{token}</Text>
              </View>
            </View>

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#6366F1" />
              <Text style={styles.infoText}>
                Transaction fees are sponsored by Lazorkit. You only pay the
                amount you send.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                isLoading && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Send</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 500,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    marginLeft: 8,
  },
  tokenBadge: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    marginLeft: 8,
    flex: 1,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#4338CA",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  sendButton: {
    flex: 1,
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
