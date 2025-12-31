/**
 * config.ts
 *
 * Configuration for Lazorkit SDK integration
 * Contains network settings, API endpoints, and feature flags
 */

export const NETWORKS = {
  devnet: {
    name: "Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com",
  },
  mainnet: {
    name: "Mainnet Beta",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
  },
  testnet: {
    name: "Testnet",
    rpcUrl: "https://api.testnet.solana.com",
    explorerUrl: "https://explorer.solana.com",
  },
} as const;

export const LAZORKIT_CONFIG = {
  // Portal configuration
  portalUrl: "https://portal.lazor.sh",

  // Paymaster configuration for gasless transactions
  paymaster: {
    devnet: "https://lazorkit-paymaster.onrender.com",
    mainnet: "https://lazorkit-paymaster-mainnet.onrender.com", // Replace with actual mainnet URL
  },

  // Transaction settings
  transactionDefaults: {
    computeUnitLimit: 200000,
    computeUnitPrice: 1000,
  },

  // Token configurations
  tokens: {
    devnet: {
      USDC: "EPjFWdd5Au57nqb255heH41CvqAstksNQm7meWsan5",
      SOL: "So11111111111111111111111111111111111111112",
    },
    mainnet: {
      USDC: "EPjFWdd5Au57nqb255heH41CvqAstksNQm7meWsan5",
      SOL: "So11111111111111111111111111111111111111112",
    },
  },

  // Feature flags
  features: {
    enableGasless: true,
    enableSwaps: true,
    enableBilling: true,
    enableSessionKeys: true,
  },

  // Security settings
  security: {
    maxTransactionAmount: 10000, // Maximum USDC per transaction
    sessionTimeout: 3600000, // 1 hour in milliseconds
    requireBiometricPerTransaction: false,
  },
} as const;

/**
 * Get configuration for a specific network
 */
export const getNetworkConfig = (network: "devnet" | "mainnet" = "devnet") => {
  return NETWORKS[network];
};

/**
 * Get paymaster URL for network
 */
export const getPaymasterUrl = (network: "devnet" | "mainnet" = "devnet") => {
  return LAZORKIT_CONFIG.paymaster[network];
};

/**
 * Get token address for network
 */
export const getTokenAddress = (
  token: "USDC" | "SOL",
  network: "devnet" | "mainnet" = "devnet"
) => {
  return LAZORKIT_CONFIG.tokens[network][token];
};
