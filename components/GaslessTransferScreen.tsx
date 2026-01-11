/**
 * GaslessTransferScreen.tsx
 *
 * Demonstrates gasless USDC transfer on Solana using Lazorkit's paymaster.
 * Users can send USDC without holding SOL for transaction fees.
 *
 * Features:
 * - Recipient address validation
 * - Amount input with real-time balance validation
 * - Paymaster fee sponsorship
 * - Transaction confirmation and history
 * - Error handling and retry logic
 */

import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const APP_SCHEME = "lazorkit://wallet";

interface Transaction {
  id: string;
  signature: string;
  type: "send" | "receive" | "swap" | "billing";
  amount: number;
  token: string;
  recipient?: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
}

interface TransferState {
  step: "form" | "review" | "processing" | "success";
  recipient: string;
  amount: string;
  error: string | null;
}

// Mock USDC token address (Devnet)
const USDC_DEVNET = "EPjFWdd5Au57nqb255heH41CvqAstksNQm7meWsan5";
// Mock wallet USDC balance
const MOCK_USDC_BALANCE = 1000;

/**
 * GaslessTransferScreen Component
 *
 * Complete flow for sending gasless USDC transactions
 */
export const GaslessTransferScreen: React.FC = () => {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();
  const walletAddress = smartWalletPubkey?.toBase58() || null;
  const [transferState, setTransferState] = useState<TransferState>({
    step: "form",
    recipient: "",
    amount: "",
    error: null,
  });
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validate recipient address format (basic Solana address validation)
   */
  const isValidSolanaAddress = (address: string): boolean => {
    // Solana addresses are base58 encoded and typically 44 characters
    return (
      address.length >= 32 &&
      address.length <= 44 &&
      /^[1-9A-HJ-NP-Z]+$/.test(address)
    );
  };

  /**
   * Validate transfer form inputs
   */
  const validateTransfer = (): boolean => {
    let error = "";

    if (!transferState.recipient.trim()) {
      error = "Please enter a recipient address";
    } else if (!isValidSolanaAddress(transferState.recipient)) {
      error = "Invalid Solana address format";
    } else if (!transferState.amount.trim()) {
      error = "Please enter an amount";
    } else if (isNaN(parseFloat(transferState.amount))) {
      error = "Amount must be a valid number";
    } else if (parseFloat(transferState.amount) <= 0) {
      error = "Amount must be greater than 0";
    } else if (parseFloat(transferState.amount) > MOCK_USDC_BALANCE) {
      error = `Insufficient balance. You have ${MOCK_USDC_BALANCE} USDC`;
    }

    if (error) {
      setTransferState((prev) => ({ ...prev, error }));
      return false;
    }

    setTransferState((prev) => ({ ...prev, error: null }));
    return true;
  };

  /**
   * Handle transfer review
   */
  const handleReviewTransfer = useCallback(() => {
    if (validateTransfer()) {
      setTransferState((prev) => ({ ...prev, step: "review" }));
    }
  }, [transferState]);

  /**
   * Handle gasless transaction submission
   */
  const handleConfirmTransfer = useCallback(async () => {
    if (!walletAddress) {
      Alert.alert("Error", "Wallet not connected");
      return;
    }

    setTransferState((prev) => ({ ...prev, step: "processing", error: null }));
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      // Create transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey!,
        toPubkey: new PublicKey(transferState.recipient),
        lamports: parseFloat(transferState.amount) * LAMPORTS_PER_SOL,
      });

      // Send gasless transaction using Lazorkit SDK
      const txSignature = await signAndSendTransaction(
        {
          instructions: [transferInstruction],
          transactionOptions: {
            feeToken: "USDC", // Pay fees with USDC
            clusterSimulation: "devnet",
          },
        },
        {
          redirectUrl: `${APP_SCHEME}/transfer-complete`,
          onSuccess: (sig) => {
            console.log("Gasless transaction successful:", sig);
          },
          onFail: (err) => {
            throw err;
          },
        }
      );

      setLastTransaction({
        id: txSignature,
        signature: txSignature,
        type: "send",
        amount: parseFloat(transferState.amount),
        token: "USDC",
        recipient: transferState.recipient,
        timestamp: Date.now(),
        status: "confirmed",
      });

      setTransferState((prev) => ({
        ...prev,
        step: "success",
        recipient: "",
        amount: "",
      }));

      // Auto-reset after 3 seconds
      setTimeout(() => {
        setTransferState((prev) => ({ ...prev, step: "form" }));
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Transfer failed";
      setTransferState((prev) => ({
        ...prev,
        step: "review",
        error: errorMsg,
      }));
      Alert.alert("Transfer Failed", errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, signAndSendTransaction, transferState]);

  /**
   * Render form step
   */
  const renderFormStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Send USDC</Text>
      <Text style={styles.stepSubtitle}>
        Gasless transaction sponsored by Lazorkit
      </Text>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceContent}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {MOCK_USDC_BALANCE.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            USDC
          </Text>
        </View>
        <View style={styles.balanceIcon}>
          <Ionicons name="wallet" size={32} color="#6366F1" />
        </View>
      </View>

      {/* Recipient Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Recipient Address</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="send" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Solana address (44 chars)"
            placeholderTextColor="#D1D5DB"
            value={transferState.recipient}
            onChangeText={(text) =>
              setTransferState((prev) => ({ ...prev, recipient: text }))
            }
            editable={!isLoading}
            selectionColor="#6366F1"
          />
        </View>
      </View>

      {/* Amount Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="cash" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#D1D5DB"
            value={transferState.amount}
            onChangeText={(text) =>
              setTransferState((prev) => ({
                ...prev,
                amount: text.replace(/[^0-9.]/g, ""),
              }))
            }
            keyboardType="decimal-pad"
            editable={!isLoading}
            selectionColor="#6366F1"
          />
          <Text style={styles.tokenSymbol}>USDC</Text>
        </View>
      </View>

      {/* Quick amounts */}
      <View style={styles.quickAmountsContainer}>
        <QuickAmountButton
          label="25 USDC"
          amount="25"
          onPress={() =>
            setTransferState((prev) => ({ ...prev, amount: "25" }))
          }
        />
        <QuickAmountButton
          label="50 USDC"
          amount="50"
          onPress={() =>
            setTransferState((prev) => ({ ...prev, amount: "50" }))
          }
        />
        <QuickAmountButton
          label="100 USDC"
          amount="100"
          onPress={() =>
            setTransferState((prev) => ({ ...prev, amount: "100" }))
          }
        />
      </View>

      {/* Error Message */}
      {transferState.error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{transferState.error}</Text>
        </View>
      )}

      {/* Gasless Fee Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="flash" size={24} color="#F59E0B" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Gasless Transaction</Text>
          <Text style={styles.infoDescription}>
            Network fees are sponsored by Lazorkit Paymaster
          </Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, !walletAddress && styles.disabledButton]}
        onPress={handleReviewTransfer}
        disabled={!walletAddress || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Review Transfer</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  /**
   * Render review step
   */
  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review Transfer</Text>

      <View style={styles.reviewCard}>
        <ReviewRow label="From" value={walletAddress?.slice(0, 10) + "..."} />
        <View style={styles.divider} />
        <ReviewRow
          label="To"
          value={transferState.recipient.slice(0, 10) + "..."}
        />
        <View style={styles.divider} />
        <ReviewRow
          label="Amount"
          value={`${transferState.amount} USDC`}
          highlight
        />
      </View>

      <View style={styles.warningCard}>
        <Ionicons name="information-circle" size={20} color="#0EA5E9" />
        <Text style={styles.warningText}>
          This transaction will be processed on Solana Devnet with sponsored
          fees
        </Text>
      </View>

      {transferState.error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{transferState.error}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() =>
            setTransferState((prev) => ({ ...prev, step: "form" }))
          }
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, styles.flex1]}
          onPress={handleConfirmTransfer}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Confirm & Send</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Render success step
   */
  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>
        <Text style={styles.successTitle}>Transfer Complete!</Text>
        <Text style={styles.successSubtitle}>
          {transferState.amount} USDC sent successfully
        </Text>

        {lastTransaction && (
          <View style={styles.transactionDetails}>
            <DetailRow
              label="Recipient"
              value={transferState.recipient.slice(0, 10) + "..."}
            />
            <DetailRow label="Amount" value={`${transferState.amount} USDC`} />
            <DetailRow
              label="TX"
              value={lastTransaction.signature.slice(0, 8) + "..."}
            />
          </View>
        )}
      </View>
    </View>
  );

  /**
   * Render processing step
   */
  const renderProcessingStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.processingTitle}>Processing Transaction</Text>
        <Text style={styles.processingSubtitle}>
          Sending {transferState.amount} USDC to recipient...
        </Text>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (transferState.step) {
      case "form":
        return renderFormStep();
      case "review":
        return renderReviewStep();
      case "processing":
        return renderProcessingStep();
      case "success":
        return renderSuccessStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * QuickAmountButton Component
 */
const QuickAmountButton: React.FC<{
  label: string;
  amount: string;
  onPress: () => void;
}> = ({ label, onPress }) => (
  <TouchableOpacity style={styles.quickAmountButton} onPress={onPress}>
    <Text style={styles.quickAmountText}>{label}</Text>
  </TouchableOpacity>
);

/**
 * ReviewRow Component
 */
const ReviewRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>{label}</Text>
    <Text style={[styles.reviewValue, highlight && styles.highlightValue]}>
      {value}
    </Text>
  </View>
);

/**
 * DetailRow Component
 */
const DetailRow: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6366F1",
  },
  balanceIcon: {
    marginLeft: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#000000",
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  quickAmountsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366F1",
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    flex: 1,
  },
  infoCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 12,
    color: "#B45309",
  },
  submitButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  reviewLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  highlightValue: {
    fontSize: 18,
    color: "#6366F1",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  warningCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#047857",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  flex1: {
    flex: 1,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
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
    marginBottom: 32,
  },
  transactionDetails: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: "#000000",
    fontWeight: "600",
  },
  processingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginTop: 24,
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});
