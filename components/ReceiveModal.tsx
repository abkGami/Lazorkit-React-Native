/**
 * ReceiveModal.tsx
 *
 * Modal component for receiving tokens
 * Displays wallet address with copy and share functionality
 */

import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import * as Clipboard from "expo-clipboard";
import React from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ReceiveModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({
  visible,
  onClose,
}) => {
  const { smartWalletPubkey } = useWallet();
  const walletAddress = smartWalletPubkey?.toBase58() || null;

  const handleCopyAddress = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      Alert.alert("Copied!", "Wallet address copied to clipboard");
    }
  };

  const handleShare = () => {
    Alert.alert(
      "Share Address",
      "Share functionality will be implemented with native share API",
      [{ text: "OK" }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Receive Tokens</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* QR Code Placeholder */}
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={120} color="#6366F1" />
            </View>
            <Text style={styles.qrLabel}>Scan QR Code</Text>
          </View>

          {/* Address Display */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Your Wallet Address</Text>
            <View style={styles.addressBox}>
              <Text style={styles.addressText} numberOfLines={1}>
                {walletAddress}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#6366F1" />
            <Text style={styles.infoText}>
              Send only Solana (SOL) and SPL tokens to this address. Sending
              other assets may result in permanent loss.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopyAddress}
            >
              <Ionicons name="copy" size={20} color="#6366F1" />
              <Text style={styles.actionButtonText}>Copy Address</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color="#6366F1" />
              <Text style={styles.actionButtonText}>Share</Text>
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  qrLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
  },
  addressContainer: {
    marginBottom: 24,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  addressBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  addressText: {
    fontSize: 14,
    color: "#111827",
    fontFamily: "monospace",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
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
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366F1",
  },
});
