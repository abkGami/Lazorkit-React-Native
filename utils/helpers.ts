/**
 * helpers.ts
 *
 * Utility functions for wallet operations, address formatting, and common tasks.
 */

import { PublicKey } from "@solana/web3.js";

/**
 * Truncate Solana address for display
 *
 * @example
 * truncateAddress('11111111111111111111111111111111') // '1111...1111'
 */
export const truncateAddress = (
  address: string | null,
  chars: number = 4
): string => {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Format large numbers with commas
 *
 * @example
 * formatNumber(1000000) // '1,000,000'
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format token amount with proper decimals
 *
 * @example
 * formatTokenAmount(1000000, 6) // '1.00'
 */
export const formatTokenAmount = (
  amount: number,
  decimals: number = 6
): string => {
  const divisor = Math.pow(10, decimals);
  const value = amount / divisor;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
};

/**
 * Validate Solana address format
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Convert lamports to SOL
 */
export const lamportsToSol = (lamports: number): number => {
  return lamports / 1_000_000_000;
};

/**
 * Convert SOL to lamports
 */
export const solToLamports = (sol: number): number => {
  return sol * 1_000_000_000;
};

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format timestamp to readable time
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format timestamp to readable date and time
 */
export const formatDateTime = (timestamp: number): string => {
  return `${formatDate(timestamp)} at ${formatTime(timestamp)}`;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    // For React Native, we would use a library like @react-native-clipboard/clipboard
    // This is a placeholder for the implementation
    console.log("Copied to clipboard:", text);
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
  }
};

/**
 * Generate a transaction explorer URL
 */
export const getExplorerUrl = (
  signature: string,
  cluster: "devnet" | "mainnet" = "devnet"
): string => {
  const baseUrl = `https://explorer.solana.com/tx/${signature}`;
  return cluster === "devnet" ? `${baseUrl}?cluster=devnet` : baseUrl;
};

/**
 * Sleep for a given number of milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Debounce function
 */
export const debounce = <T extends any[]>(
  func: (...args: T) => void,
  wait: number
) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delayMs * Math.pow(2, attempt - 1));
      }
    }
  }

  throw lastError!;
};

/**
 * Generate a random transaction ID
 */
export const generateTxId = (): string => {
  return "tx_" + Math.random().toString(36).substr(2, 16);
};

/**
 * Parse transaction metadata from signature
 */
export const parseTransactionSignature = (signature: string) => {
  return {
    shortSig: signature.slice(0, 8) + "..." + signature.slice(-8),
    explorerUrl: getExplorerUrl(signature),
  };
};
