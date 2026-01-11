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
 *
 * Note: Uses SDK store directly without LazorKitProvider due to React Native compatibility issues
 */

import { useWalletStore } from "@lazorkit/wallet-mobile-adapter";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Import SDK initialization
import { initLazorkitSDK } from "@/utils/lazorkit";

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
  balance: number | null;

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
  fetchBalance: () => Promise<void>;

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
  // Initialize SDK store
  React.useEffect(() => {
    initLazorkitSDK(network);
  }, [network]);

  // Access wallet store actions and state
  const walletInfo = useWalletStore((state) => state.wallet);
  const connection = useWalletStore((state) => state.connection);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);
  const signMessage = useWalletStore((state) => state.signMessage);
  const signAndExecuteTransaction = useWalletStore(
    (state) => state.signAndExecuteTransaction
  );
  const storeError = useWalletStore((state) => state.error);
  const isLoading = useWalletStore((state) => state.isLoading);

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastActivity, setLastActivity] = useState<number | null>(null);

  const rpcUrl =
    network === "devnet"
      ? "https://api.devnet.solana.com"
      : "https://api.mainnet-beta.solana.com";

  const portalUrl = "https://portal.lazor.sh";
  const paymasterUrl = "https://lazorkit-paymaster.onrender.com";

  /**
   * Fetch wallet balance from blockchain
   */
  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;

    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }, [publicKey, connection]);

  /**
   * Sync SDK wallet state with local context
   */
  useEffect(() => {
    // Check wallet info from store
    const currentAddress = walletInfo?.smartWallet || null;

    // Only update if the address actually changed to prevent infinite loops
    if (currentAddress !== walletAddress) {
      if (currentAddress) {
        try {
          const pubKey = new PublicKey(currentAddress);
          setWalletAddress(currentAddress);
          setPublicKey(pubKey);
          setIsConnected(true);
        } catch (err) {
          console.error("Invalid public key:", err);
          setWalletAddress(null);
          setPublicKey(null);
          setIsConnected(false);
        }
      } else {
        setWalletAddress(null);
        setPublicKey(null);
        setIsConnected(false);
        setBalance(null);
      }
    }
  }, [walletInfo, walletAddress]);

  /**
   * Sync store errors with local error state
   */
  useEffect(() => {
    if (storeError) {
      setError(storeError.message);
    }
  }, [storeError]);

  /**
   * Fetch balance when publicKey changes
   */
  useEffect(() => {
    if (publicKey && isConnected) {
      fetchBalance();
    }
  }, [publicKey, isConnected, fetchBalance]);

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
   * Restore wallet session from secure storage
   */
  const restoreSession = useCallback(async () => {
    try {
      const savedWallet = await SecureStore.getItemAsync("walletAddress");
      const savedActivity = await SecureStore.getItemAsync("lastActivity");
      const savedTransactions = await SecureStore.getItemAsync("transactions");

      if (savedWallet) {
        try {
          // Validate that the saved address is a valid base58 public key
          const pubKey = new PublicKey(savedWallet);
          setWalletAddress(savedWallet);
          setPublicKey(pubKey);
          setIsConnected(true);
        } catch (keyError) {
          console.error(
            "Invalid public key in storage, clearing session:",
            keyError
          );
          // Clear invalid session data
          await clearSession();
          return;
        }
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
  }, [clearSession]);

  /**
   * Connect wallet using Lazorkit passkey authentication
   */
  const connectWallet = useCallback(
    async (options?: { redirectUrl?: string }) => {
      setError(null);

      try {
        // Use store's connect action
        const result = await connect({
          redirectUrl: options?.redirectUrl || "lazorkit://",
        });

        if (result?.smartWallet) {
          // Save to secure storage
          await SecureStore.setItemAsync("walletAddress", result.smartWallet);
          await SecureStore.setItemAsync("lastActivity", Date.now().toString());
          setLastActivity(Date.now());

          console.log("Lazorkit wallet connected:", result.smartWallet);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to connect wallet";
        setError(errorMsg);
        console.error("Connect wallet error:", err);
      }
    },
    [connect]
  );

  // Note: clearSession needs to be defined before restoreSession since it's used there
  // Moving clearSession definition above restoreSession

  /**
   * Disconnect wallet and clear session
   */
  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error("Disconnect error:", err);
    }
    await clearSession();
  }, [disconnect, clearSession]);

  /**
   * Sign a message using the connected wallet
   */
  const signMessageHandler = useCallback(
    async (
      message: string,
      options?: { redirectUrl?: string }
    ): Promise<string> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        await signMessage(message, {
          redirectUrl: options?.redirectUrl || "lazorkit://",
        });

        setLastActivity(Date.now());
        return "signed"; // Store action doesn't return signature directly
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to sign message";
        setError(errorMsg);
        console.error("Sign message error:", err);
        throw err;
      }
    },
    [isConnected, signMessage]
  );

  /**
   * Send a gasless transaction using the smart wallet
   */
  const sendTransactionHandler = useCallback(
    async (
      recipient: string,
      amount: number,
      token: string,
      options?: { redirectUrl?: string }
    ): Promise<string> => {
      if (!isConnected || !publicKey) {
        throw new Error("Wallet not connected");
      }

      try {
        const recipientPubkey = new PublicKey(recipient);
        const lamports = amount * LAMPORTS_PER_SOL;

        // Create transfer instruction
        const instruction = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        });

        // Use store's signAndExecuteTransaction
        await signAndExecuteTransaction(
          {
            instructions: [instruction],
            transactionOptions: {
              clusterSimulation: network === "devnet" ? "devnet" : "mainnet",
            },
          },
          {
            redirectUrl: options?.redirectUrl || "lazorkit://",
          }
        );

        // Generate temporary transaction ID (signAndExecuteTransaction doesn't return signature)
        const tempTxId = `tx_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Create transaction record
        const newTx: Transaction = {
          id: tempTxId,
          signature: tempTxId,
          type: "send",
          amount,
          token,
          recipient,
          timestamp: Date.now(),
          status: "confirmed", // Mark as confirmed since SDK handles it
        };

        // Update state and storage
        const updatedTxs = [newTx, ...transactions];
        setTransactions(updatedTxs);
        setLastActivity(Date.now());

        await SecureStore.setItemAsync(
          "transactions",
          JSON.stringify(updatedTxs)
        );
        await SecureStore.setItemAsync("lastActivity", Date.now().toString());

        console.log("Transaction sent:", tempTxId);
        return tempTxId;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to send transaction";
        setError(errorMsg);
        console.error("Send transaction error:", err);
        throw err;
      }
    },
    [
      isConnected,
      publicKey,
      transactions,
      network,
      connection,
      signAndExecuteTransaction,
    ]
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
    balance,
    network,
    rpcUrl,
    portalUrl,
    paymasterUrl,
    connectWallet,
    disconnectWallet,
    signMessage: signMessageHandler,
    sendTransaction: sendTransactionHandler,
    fetchBalance,
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
