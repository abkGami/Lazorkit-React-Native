/**
 * WalletDashboard.tsx
 *
 * Main dashboard showing wallet balance, transaction history, and quick actions.
 * Users can view their wallet details, transaction history, and access main features.
 */

import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatNumber, truncateAddress } from "../utils/helpers";
import { ReceiveModal } from "./ReceiveModal";
import { SendTokensModal } from "./SendTokensModal";

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

/**
 * WalletDashboard Component
 *
 * Complete wallet interface with balance, transactions, and action buttons
 */
export const WalletDashboard: React.FC = () => {
  const { smartWalletPubkey, isConnected, disconnect } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);

  const walletAddress = smartWalletPubkey?.toBase58() || null;

  /**
   * Fetch wallet balance
   */
  const fetchBalance = useCallback(async () => {
    if (!smartWalletPubkey) return;

    try {
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );
      const bal = await connection.getBalance(smartWalletPubkey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }, [smartWalletPubkey]);

  /**
   * Fetch balance when wallet is connected
   */
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalance();
    }
  }, [isConnected, smartWalletPubkey, fetchBalance]);

  /**
   * Handle wallet refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchBalance();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  }, [fetchBalance]);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    Alert.alert("Disconnect Wallet", "Are you sure you want to disconnect?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Disconnect",
        onPress: async () => {
          await disconnect({
            onSuccess: () => {
              console.log("Wallet disconnected successfully");
            },
            onFail: (err) => {
              console.error("Failed to disconnect:", err);
              Alert.alert("Error", "Failed to disconnect wallet");
            },
          });
        },
        style: "destructive",
      },
    ]);
  }, [disconnect]);

  /**
   * Handle Send action
   */
  const handleSend = useCallback(() => {
    setSendModalVisible(true);
  }, []);

  /**
   * Handle Receive action
   */
  const handleReceive = useCallback(() => {
    setReceiveModalVisible(true);
  }, []);

  /**
   * Handle Swap action
   */
  const handleSwap = useCallback(() => {
    Alert.alert(
      "Swap Tokens",
      "Token swap functionality coming soon! This will allow you to swap between different tokens using Lazorkit's gasless transactions.",
      [{ text: "OK" }]
    );
  }, []);

  /**
   * Handle Pay action
   */
  const handlePay = useCallback(() => {
    Alert.alert(
      "Pay with Crypto",
      "Payment functionality coming soon! This will allow you to pay merchants directly with crypto using Lazorkit.",
      [{ text: "OK" }]
    );
  }, []);

  /**
   * Handle successful send
   */
  const handleSendSuccess = useCallback(
    (signature: string) => {
      console.log("Transaction successful:", signature);
      handleRefresh(); // Refresh the dashboard to show new transaction
    },
    [handleRefresh]
  );

  /**
   * Get display balance
   */
  const getDisplayBalance = () => {
    return balance !== null ? balance : 0;
  };

  /**
   * Get transaction icon
   */
  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case "send":
        return "arrow-up";
      case "receive":
        return "arrow-down";
      case "swap":
        return "swap-horizontal";
      case "billing":
        return "card";
      default:
        return "flash";
    }
  };

  /**
   * Get transaction color
   */
  const getTransactionColor = (type: string): string => {
    switch (type) {
      case "send":
        return "#EF4444";
      case "receive":
        return "#10B981";
      case "swap":
        return "#F59E0B";
      case "billing":
        return "#8B5CF6";
      default:
        return "#6366F1";
    }
  };

  /**
   * Render transaction item
   */
  const renderTransactionItem = ({ item }: any) => (
    <View style={styles.transactionItem}>
      <View
        style={[
          styles.txIcon,
          { backgroundColor: getTransactionColor(item.type) + "20" },
        ]}
      >
        <Ionicons
          name={getTransactionIcon(item.type) as any}
          size={20}
          color={getTransactionColor(item.type)}
        />
      </View>

      <View style={styles.txContent}>
        <Text style={styles.txType}>
          {item.type === "send"
            ? "Sent"
            : item.type === "receive"
            ? "Received"
            : item.type.toUpperCase()}
        </Text>
        <Text style={styles.txAddress}>
          {item.recipient ? truncateAddress(item.recipient) : "Transaction"}
        </Text>
      </View>

      <View style={styles.txAmount}>
        <Text
          style={[
            styles.txAmountText,
            { color: item.type === "send" ? "#EF4444" : "#10B981" },
          ]}
        >
          {item.type === "send" ? "-" : "+"}
          {item.amount} {item.token}
        </Text>
        <Text style={styles.txTime}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="wallet" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Wallet Not Connected</Text>
          <Text style={styles.emptySubtitle}>
            Please authenticate to view your wallet
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayBalance = getDisplayBalance();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Your Wallet</Text>
            <Text style={styles.address}>
              {truncateAddress(walletAddress || "")}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatNumber(displayBalance)} SOL
            </Text>
            <Text style={styles.balanceInUSDC}>
              {balance !== null
                ? `≈ $${(displayBalance * 100).toFixed(2)}`
                : "Loading..."}
            </Text>
          </View>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={48} color="#6366F1" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <QuickActionButton
            icon="arrow-forward"
            label="Send"
            onPress={handleSend}
          />
          <QuickActionButton
            icon="arrow-back"
            label="Receive"
            onPress={handleReceive}
          />
          <QuickActionButton
            icon="swap-horizontal"
            label="Swap"
            onPress={handleSwap}
          />
          <QuickActionButton icon="card" label="Pay" onPress={handlePay} />
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>

          <Feature
            icon="flash"
            title="Gasless Transactions"
            description="Send transactions with sponsored fees"
          />
          <Feature
            icon="finger-print"
            title="Biometric Security"
            description="Secured by FaceID or TouchID"
          />
          <Feature
            icon="shield-checkmark"
            title="Smart Wallet"
            description="Programmable account with recovery"
          />
        </View>

        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>

          {transactions.length > 0 ? (
            <FlatList
              data={transactions.slice(0, 5)}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.txDivider} />}
            />
          ) : (
            <View style={styles.emptyTransactions}>
              <Ionicons name="swap-horizontal" size={40} color="#D1D5DB" />
              <Text style={styles.emptyTxText}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <SendTokensModal
        visible={sendModalVisible}
        onClose={() => setSendModalVisible(false)}
        onSuccess={handleSendSuccess}
      />
      <ReceiveModal
        visible={receiveModalVisible}
        onClose={() => setReceiveModalVisible(false)}
      />
    </SafeAreaView>
  );
};

/**
 * QuickActionButton Component
 */
const QuickActionButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
    <View style={styles.quickActionIcon}>
      <Ionicons name={icon as any} size={24} color="#6366F1" />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

/**
 * Feature Component
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
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Courier New",
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: "#6366F1",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  balanceInUSDC: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
  },
  balanceIcon: {
    marginLeft: 16,
  },
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: "#6B7280",
  },
  transactionSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txContent: {
    flex: 1,
  },
  txType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  txAddress: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Courier New",
  },
  txAmount: {
    alignItems: "flex-end",
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  txTime: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  txDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  emptyTransactions: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyTxText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
});
