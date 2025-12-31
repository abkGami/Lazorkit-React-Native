/**
 * WalletContext.tsx
 *
 * Global wallet context for managing Lazorkit wallet state across the application.
 * Provides access to wallet connection, transactions, and user session management.
 *
 * Features:
 * - Passkey authentication state management
 * - Transaction history tracking
 * - Session persistence
 * - Network configuration
 */

import { PublicKey } from "@solana/web3.js";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Transaction {
  id: string;
  signature: string;
  type: "send" | "receive" | "swap" | "billing";
  amount: number;
  token: string;
  recipient?: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
}

export interface WalletContextType {
  // Wallet State
  walletAddress: string | null;
  publicKey: PublicKey | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Network Configuration
  network: "devnet" | "mainnet";
  rpcUrl: string;
  portalUrl: string;
  paymasterUrl: string;

  // Operations
  connectWallet: (options?: { redirectUrl?: string }) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signMessage: (
    message: string,
    options?: { redirectUrl?: string }
  ) => Promise<string>;
  sendTransaction: (
    recipient: string,
    amount: number,
    token: string,
    options?: { redirectUrl?: string }
  ) => Promise<string>;

  // History & Session
  transactions: Transaction[];
  lastActivity: number | null;
  restoreSession: () => Promise<void>;
  clearSession: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: React.ReactNode;
  network?: "devnet" | "mainnet";
}

/**
 * WalletProvider Component
 *
 * Wraps the application and provides wallet context to all child components.
 *
 * @example
 * ```jsx
 * <WalletProvider network="devnet">
 *   <App />
 * </WalletProvider>
 * ```
 */
export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  network = "devnet",
}) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastActivity, setLastActivity] = useState<number | null>(null);

  const rpcUrl =
    network === "devnet"
      ? "https://api.devnet.solana.com"
      : "https://api.mainnet-beta.solana.com";

  const portalUrl = "https://portal.lazor.sh";
  const paymasterUrl = "https://lazorkit-paymaster.onrender.com";

  /**
   * Restore wallet session from secure storage
   */
  const restoreSession = useCallback(async () => {
    try {
      const savedWallet = await SecureStore.getItemAsync("walletAddress");
      const savedActivity = await SecureStore.getItemAsync("lastActivity");
      const savedTransactions = await SecureStore.getItemAsync("transactions");

      if (savedWallet) {
        setWalletAddress(savedWallet);
        setPublicKey(new PublicKey(savedWallet));
        setIsConnected(true);
      }

      if (savedActivity) {
        setLastActivity(parseInt(savedActivity));
      }

      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    } catch (err) {
      console.error("Failed to restore session:", err);
      setError("Failed to restore session");
    }
  }, []);

  /**
   * Clear wallet session and stored data
   */
  const clearSession = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync("walletAddress");
      await SecureStore.deleteItemAsync("lastActivity");
      await SecureStore.deleteItemAsync("transactions");

      setWalletAddress(null);
      setPublicKey(null);
      setIsConnected(false);
      setTransactions([]);
      setLastActivity(null);
      setError(null);
    } catch (err) {
      console.error("Failed to clear session:", err);
    }
  }, []);

  /**
   * Connect wallet using Lazorkit passkey authentication
   */
  const connectWallet = useCallback(
    async (options?: { redirectUrl?: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        // This will be implemented with actual Lazorkit SDK integration
        // For now, we'll simulate the connection
        const simulatedAddress =
          "LazorKitWallet" + Math.random().toString(36).substr(2, 9);

        setWalletAddress(simulatedAddress);
        setPublicKey(new PublicKey("11111111111111111111111111111111"));
        setIsConnected(true);

        // Save to secure storage
        await SecureStore.setItemAsync("walletAddress", simulatedAddress);
        await SecureStore.setItemAsync("lastActivity", Date.now().toString());

        setLastActivity(Date.now());
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to connect wallet";
        setError(errorMsg);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Disconnect wallet and clear session
   */
  const disconnectWallet = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  /**
   * Sign a message using the connected wallet
   */
  const signMessage = useCallback(
    async (
      message: string,
      options?: { redirectUrl?: string }
    ): Promise<string> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      try {
        // This will be implemented with actual Lazorkit SDK integration
        const signature = "sig_" + Math.random().toString(36).substr(2, 16);
        setLastActivity(Date.now());
        return signature;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to sign message";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected]
  );

  /**
   * Send a gasless transaction using the smart wallet
   */
  const sendTransaction = useCallback(
    async (
      recipient: string,
      amount: number,
      token: string,
      options?: { redirectUrl?: string }
    ): Promise<string> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      try {
        const txId = "tx_" + Math.random().toString(36).substr(2, 16);
        const newTx: Transaction = {
          id: txId,
          signature: txId,
          type: token === "USDC" ? "send" : "send",
          amount,
          token,
          recipient,
          timestamp: Date.now(),
          status: "pending",
        };

        setTransactions((prev) => [newTx, ...prev]);
        setLastActivity(Date.now());

        // Save to storage
        const updated = [newTx, ...transactions];
        await SecureStore.setItemAsync("transactions", JSON.stringify(updated));
        await SecureStore.setItemAsync("lastActivity", Date.now().toString());

        return txId;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to send transaction";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, transactions]
  );

  // Restore session on component mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const value: WalletContextType = {
    walletAddress,
    publicKey,
    isConnected,
    isLoading,
    error,
    network,
    rpcUrl,
    portalUrl,
    paymasterUrl,
    connectWallet,
    disconnectWallet,
    signMessage,
    sendTransaction,
    transactions,
    lastActivity,
    restoreSession,
    clearSession,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

/**
 * Hook to access wallet context
 *
 * @example
 * ```jsx
 * const { walletAddress, connectWallet } = useWallet();
 * ```
 */
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
