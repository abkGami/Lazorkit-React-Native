/**
 * lazorkit.ts
 *
 * Lazorkit SDK integration utilities
 * Handles smart wallet operations, transaction signing, and Paymaster integration
 */

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { getPaymasterUrl } from "./config";

/**
 * Smart Wallet interface representing an on-chain Lazorkit wallet
 */
export interface SmartWallet {
  address: PublicKey;
  owner: PublicKey;
  bump: number;
  policies: SpendingPolicy[];
  sessionKeys: SessionKey[];
  recovered: boolean;
}

/**
 * Spending policy for limiting transaction amounts
 */
export interface SpendingPolicy {
  token: PublicKey;
  dailyLimit: number;
  monthlyLimit: number;
  recipient?: PublicKey;
  active: boolean;
}

/**
 * Session key for scoped application access
 */
export interface SessionKey {
  publicKey: PublicKey;
  permissions: SessionPermissions;
  createdAt: number;
  expiresAt: number;
}

/**
 * Session key permissions
 */
export interface SessionPermissions {
  maxAmount?: number;
  allowedRecipients?: PublicKey[];
  allowedTokens?: PublicKey[];
  allowedPrograms?: PublicKey[];
}

/**
 * Paymaster validation response
 */
export interface PaymasterValidation {
  valid: boolean;
  sponsorshipAvailable: boolean;
  fee: number;
  feeToken: PublicKey;
  error?: string;
}

/**
 * Create a Lazorkit smart wallet account
 *
 * @example
 * ```typescript
 * const wallet = await createSmartWallet(ownerPublicKey, connection);
 * ```
 */
export const createSmartWallet = async (
  ownerPublicKey: PublicKey,
  connection: Connection
): Promise<SmartWallet> => {
  // This would call the Lazorkit program to create a new wallet
  // For demo purposes, we're returning a mock wallet
  return {
    address: ownerPublicKey, // In real implementation, this would be a PDA
    owner: ownerPublicKey,
    bump: 255,
    policies: [],
    sessionKeys: [],
    recovered: false,
  };
};

/**
 * Fetch smart wallet details from blockchain
 */
export const fetchSmartWallet = async (
  walletAddress: PublicKey,
  connection: Connection
): Promise<SmartWallet | null> => {
  try {
    // Would fetch account from blockchain
    // Parse wallet state from account data
    return null;
  } catch (error) {
    console.error("Failed to fetch smart wallet:", error);
    return null;
  }
};

/**
 * Validate transaction with Paymaster
 *
 * Checks if Paymaster can sponsor the transaction
 *
 * @example
 * ```typescript
 * const validation = await validateWithPaymaster(
 *   transaction,
 *   walletAddress,
 *   'devnet'
 * );
 *
 * if (validation.sponsorshipAvailable) {
 *   // Send transaction
 * }
 * ```
 */
export const validateWithPaymaster = async (
  transaction: Transaction,
  walletAddress: PublicKey,
  network: "devnet" | "mainnet" = "devnet"
): Promise<PaymasterValidation> => {
  try {
    const paymasterUrl = getPaymasterUrl(network);

    // Serialize transaction for validation
    const txBase64 = transaction.serialize().toString("base64");

    const response = await fetch(`${paymasterUrl}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction: txBase64,
        userAddress: walletAddress.toBase58(),
      }),
    });

    const data = await response.json();

    return {
      valid: data.valid ?? false,
      sponsorshipAvailable: data.sponsorshipAvailable ?? false,
      fee: data.fee ?? 0,
      feeToken: new PublicKey(
        data.feeToken || "So11111111111111111111111111111111111111112"
      ),
      error: data.error,
    };
  } catch (error) {
    console.error("Paymaster validation failed:", error);
    return {
      valid: false,
      sponsorshipAvailable: false,
      fee: 0,
      feeToken: new PublicKey("So11111111111111111111111111111111111111112"),
      error: "Validation failed",
    };
  }
};

/**
 * Submit transaction to Paymaster for sponsorship
 *
 * @example
 * ```typescript
 * const signature = await submitToPaymaster(
 *   signedTransaction,
 *   'devnet'
 * );
 * ```
 */
export const submitToPaymaster = async (
  signedTransaction: Transaction,
  network: "devnet" | "mainnet" = "devnet"
): Promise<string> => {
  try {
    const paymasterUrl = getPaymasterUrl(network);

    const txBase64 = signedTransaction.serialize().toString("base64");

    const response = await fetch(`${paymasterUrl}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction: txBase64,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit transaction");
    }

    return data.signature || "";
  } catch (error) {
    throw new Error(`Paymaster submission failed: ${error}`);
  }
};

/**
 * Create a spending policy for smart wallet
 *
 * Limits spending per token and recipient
 *
 * @example
 * ```typescript
 * const policy = createSpendingPolicy({
 *   token: USDC_MINT,
 *   dailyLimit: 1000,
 *   recipient: someAddress,
 * });
 * ```
 */
export const createSpendingPolicy = (
  token: PublicKey,
  dailyLimit: number,
  monthlyLimit?: number,
  recipient?: PublicKey
): SpendingPolicy => {
  return {
    token,
    dailyLimit,
    monthlyLimit: monthlyLimit || dailyLimit * 30,
    recipient,
    active: true,
  };
};

/**
 * Create a session key with limited permissions
 *
 * Allows scoped access without requiring biometric confirmation
 *
 * @example
 * ```typescript
 * const sessionKey = createSessionKey({
 *   maxAmount: 100,
 *   allowedTokens: [USDC_MINT],
 *   expiresIn: 24 * 60 * 60, // 24 hours
 * });
 * ```
 */
export const createSessionKey = (
  permissions: SessionPermissions,
  expirationSeconds: number = 3600
): SessionKey => {
  // Generate ephemeral keypair
  // This would be done by the Lazorkit SDK

  return {
    publicKey: new PublicKey("So11111111111111111111111111111111111111112"),
    permissions,
    createdAt: Date.now(),
    expiresAt: Date.now() + expirationSeconds * 1000,
  };
};

/**
 * Check if session key has permission for transaction
 */
export const validateSessionKeyPermissions = (
  sessionKey: SessionKey,
  recipient: PublicKey,
  amount: number,
  token: PublicKey
): boolean => {
  const { permissions } = sessionKey;

  // Check expiration
  if (sessionKey.expiresAt < Date.now()) {
    return false;
  }

  // Check amount limit
  if (permissions.maxAmount && amount > permissions.maxAmount) {
    return false;
  }

  // Check recipient whitelist
  if (permissions.allowedRecipients) {
    if (!permissions.allowedRecipients.some((r) => r.equals(recipient))) {
      return false;
    }
  }

  // Check token whitelist
  if (permissions.allowedTokens) {
    if (!permissions.allowedTokens.some((t) => t.equals(token))) {
      return false;
    }
  }

  return true;
};

/**
 * Recover smart wallet if device is lost
 *
 * Uses recovery address to regain access
 */
export const recoverSmartWallet = async (
  walletAddress: PublicKey,
  recoveryAddress: PublicKey,
  connection: Connection
): Promise<boolean> => {
  try {
    // Send recovery transaction to on-chain program
    // Would require signing with recovery address
    return true;
  } catch (error) {
    console.error("Recovery failed:", error);
    return false;
  }
};

/**
 * Get wallet transaction history
 *
 * @example
 * ```typescript
 * const txs = await getWalletTransactionHistory(
 *   walletAddress,
 *   connection,
 *   { limit: 20 }
 * );
 * ```
 */
export const getWalletTransactionHistory = async (
  walletAddress: PublicKey,
  connection: Connection,
  options: { limit?: number; before?: string } = {}
): Promise<any[]> => {
  try {
    const signatures = await connection.getSignaturesForAddress(walletAddress, {
      limit: options.limit || 10,
      before: options.before,
    });

    // Parse transactions
    const transactions = await Promise.all(
      signatures.map((sig) => connection.getParsedTransaction(sig.signature))
    );

    return transactions.filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch transaction history:", error);
    return [];
  }
};

/**
 * Check Paymaster health and availability
 */
export const checkPaymasterHealth = async (
  network: "devnet" | "mainnet" = "devnet"
): Promise<boolean> => {
  try {
    const paymasterUrl = getPaymasterUrl(network);

    const response = await fetch(`${paymasterUrl}/health`);
    return response.ok;
  } catch (error) {
    console.error("Paymaster health check failed:", error);
    return false;
  }
};

/**
 * Calculate transaction fees including Paymaster fee
 */
export const estimateTransactionCost = (
  transaction: Transaction,
  paymasterFee: number = 0
): number => {
  // Base network fee (~0.00025 SOL)
  const networkFee = 0.00025;

  // Paymaster fee (typically 0-10% of transaction value)
  const totalFee = networkFee + paymasterFee;

  return totalFee;
};

/**
 * Convert token amount to base units (considering decimals)
 *
 * @example
 * ```typescript
 * const baseUnits = tokenAmountToBaseUnits(100, 6); // 100000000
 * ```
 */
export const tokenAmountToBaseUnits = (
  amount: number,
  decimals: number
): number => {
  return amount * Math.pow(10, decimals);
};

/**
 * Convert base units to token amount
 *
 * @example
 * ```typescript
 * const amount = baseUnitsToTokenAmount(100000000, 6); // 100
 * ```
 */
export const baseUnitsToTokenAmount = (
  baseUnits: number,
  decimals: number
): number => {
  return baseUnits / Math.pow(10, decimals);
};
