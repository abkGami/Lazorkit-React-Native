# Lazorkit React Native Example

A production-ready React Native (Expo) integration example demonstrating **Lazorkit SDK** capabilities for building passwordless, gasless Solana applications.

## 🚀 Overview

This example showcases how to build modern blockchain UX without traditional wallet apps or seed phrases. Users authenticate with biometrics (FaceID/TouchID) and perform gasless transactions through Lazorkit's smart wallet infrastructure.

**Key Features:**

- ✅ **Passkey-based Authentication** - Biometric login with FaceID/TouchID
- ✅ **Gasless Transactions** - Send USDC without holding SOL via Paymaster
- ✅ **Smart Wallet** - Programmable accounts with session management
- ✅ **Cross-Device Recovery** - Restore wallet across devices
- ✅ **Beautiful UI** - Modern, production-grade user interface
- ✅ **Full Documentation** - Clear code comments and tutorials

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Setup Instructions](#setup-instructions)
4. [Core Concepts](#core-concepts)
5. [Step-by-Step Tutorials](#step-by-step-tutorials)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Contributing](#contributing)

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Expo CLI (`npm install -g expo-cli`)
- iOS/Android device or simulator
- Solana Devnet faucet access

### Installation & Setup

```bash
# 1. Clone and install dependencies
git clone https://github.com/lazor-kit/react-native-example.git
cd react-native-example
npm install
# or
pnpm install

# 2. Install pods (iOS only)
cd ios && pod install && cd ..

# 3. Configure environment
cp .env.example .env

# 4. Start development server
npm start
# or
expo start

# 5. Run on device/simulator
# Press 'i' for iOS or 'a' for Android
```

### Running on Physical Device

```bash
# Install Expo Go
# iOS: Download from App Store
# Android: Download from Google Play

# Scan QR code from terminal with Expo Go app
```

## 📁 Project Structure

```
lazor-kit/
├── app/                          # Expo Router navigation
│   ├── _layout.tsx              # Root layout with context providers
│   ├── index.tsx                # Home/authentication screen
│   └── (tabs)/                  # Tab-based navigation
│       ├── wallet.tsx           # Wallet dashboard
│       ├── send.tsx             # Send/transfer screen
│       └── settings.tsx         # Settings screen
│
├── components/                   # Reusable React components
│   ├── AuthenticationScreen.tsx  # Passkey authentication flow
│   ├── GaslessTransferScreen.tsx # USDC transfer with gasless payment
│   └── WalletDashboard.tsx       # Wallet overview & history
│
├── context/                      # React Context for state management
│   └── WalletContext.tsx         # Global wallet state & operations
│
├── utils/                        # Helper functions
│   ├── config.ts                 # Configuration & constants
│   ├── helpers.ts                # Utility functions
│   └── lazorkit.ts               # Lazorkit SDK integration
│
├── hooks/                        # Custom React hooks
│   └── use-color-scheme.ts       # Theme management
│
├── constants/                    # App constants
│   └── theme.ts                  # Theme colors & styles
│
├── assets/                       # Static assets
│   └── images/                   # App images
│
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── .env.example                  # Environment variables template
```

## 🔧 Setup Instructions

### 1. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# Network Configuration
EXPO_PUBLIC_NETWORK=devnet
EXPO_PUBLIC_RPC_URL=https://api.devnet.solana.com

# Lazorkit Configuration
EXPO_PUBLIC_PORTAL_URL=https://portal.lazor.sh
EXPO_PUBLIC_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com

# Deep Link Configuration
EXPO_PUBLIC_DEEP_LINK_SCHEME=lazorkit

# Feature Flags
EXPO_PUBLIC_ENABLE_GASLESS=true
EXPO_PUBLIC_ENABLE_SWAPS=false
```

### 2. Install Dependencies

```bash
npm install
# Install peer dependencies
npm install @lazorkit/wallet-mobile-adapter @solana/web3.js zustand expo-secure-store
```

### 3. Configure Deep Links (iOS)

In `app.json`:

```json
{
  "scheme": "lazorkit",
  "plugins": [
    [
      "expo-build-properties",
      {
        "ios": { "useFrameworks": "static" }
      }
    ]
  ]
}
```

### 4. Configure Deep Links (Android)

Automatically configured via Expo Router with `app/_layout.tsx`.

### 5. Run on Simulator/Device

```bash
# Start Expo development server
npm start

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Physical Device
# Scan QR code with Expo Go app
```

## 🎯 Core Concepts

### Passkey Authentication

Passkeys replace traditional seed phrases using WebAuthn standard:

```typescript
// Users authenticate with biometrics
const { connectWallet } = useWallet();

await connectWallet({
  redirectUrl: "lazorkit://wallet/connected",
});
// FaceID/TouchID prompt appears on device
```

**Benefits:**

- Hardware-bound credentials (Secure Enclave)
- No seed phrase management
- Recovery via iCloud/Google Account
- Cross-device synchronization

### Smart Wallet (PDAs)

Accounts are Program Derived Addresses controlled by Lazorkit program:

```typescript
interface SmartWallet {
  address: PublicKey; // Wallet address
  owner: PublicKey; // User's passkey public key
  policies: SpendingPolicy[]; // On-chain spending limits
  sessionKeys: SessionKey[]; // Ephemeral keys for scoped access
}
```

**Features:**

- Recovery: Restore access if device is lost
- Policies: Set spending limits per token/recipient
- Session Keys: Scoped permissions for applications

### Gasless Transactions (Paymaster)

Lazorkit Paymaster sponsors transaction fees:

```typescript
const { sendTransaction } = useWallet();

// Recipient pays no SOL for fees
await sendTransaction(
  "recipientAddress",
  100,
  "USDC", // Can use any token for payment
  { redirectUrl: "lazorkit://transfer/complete" }
);
```

**How It Works:**

1. User selects token and amount
2. Smart wallet creates transaction
3. Paymaster validates and sponsors fees
4. Transaction executes on Solana
5. Fee deducted from smart wallet balance

## 📚 Step-by-Step Tutorials

### Tutorial 1: Creating a Passkey-Based Wallet

This tutorial shows how to implement biometric authentication and create a smart wallet.

#### Step 1: Wrap App with WalletProvider

```typescript
// app/_layout.tsx
import { WalletProvider } from "@/context/WalletContext";

export default function RootLayout() {
  return (
    <WalletProvider network="devnet">
      <Stack />
    </WalletProvider>
  );
}
```

#### Step 2: Create Authentication UI

```typescript
// components/AuthenticationScreen.tsx
import { useWallet } from "@/context/WalletContext";

export const AuthenticationScreen = () => {
  const { connectWallet, isLoading } = useWallet();

  const handleCreateWallet = async () => {
    try {
      // Triggers biometric prompt
      await connectWallet({
        redirectUrl: "lazorkit://wallet/connected",
      });
      // On success, wallet is connected and ready
    } catch (error) {
      // Handle error
    }
  };

  return (
    <TouchableOpacity onPress={handleCreateWallet}>
      <Text>Create Wallet with Passkey</Text>
    </TouchableOpacity>
  );
};
```

#### Step 3: Handle Biometric Prompt

```typescript
// When user taps "Create Wallet"
// 1. Device shows biometric prompt (FaceID/TouchID)
// 2. User authenticates with biometrics
// 3. System creates passkey in Secure Enclave
// 4. Lazorkit creates smart wallet on-chain
// 5. App receives wallet address
```

#### Step 4: Restore Session Across App Restarts

```typescript
// WalletContext automatically restores on app launch
const { restoreSession } = useWallet();

useEffect(() => {
  restoreSession(); // Reads from secure storage
}, []);
```

**Key Points:**

- Passkey is stored in device's Secure Enclave
- Never exported or backed up manually
- Automatically syncs to iCloud/Google Account
- Can restore on new device with same account

---

### Tutorial 2: Sending Gasless USDC Transactions

This tutorial demonstrates how to send USDC without holding SOL using the Paymaster.

#### Step 1: Check Balance

```typescript
// components/GaslessTransferScreen.tsx
const MOCK_USDC_BALANCE = 1000; // In actual app, fetch from blockchain

const balance = MOCK_USDC_BALANCE;
```

#### Step 2: Validate Recipient Address

```typescript
const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Before sending, validate:
if (!isValidSolanaAddress(recipientAddress)) {
  Alert.alert("Error", "Invalid Solana address");
  return;
}
```

#### Step 3: Create Transfer Instruction

```typescript
const { sendTransaction } = useWallet();

const amount = 100; // USDC amount

// This internally creates a transfer instruction:
// SystemProgram.transfer({
//   fromPubkey: wallet.address,
//   toPubkey: new PublicKey(recipient),
//   lamports: amount
// })
```

#### Step 4: Sign and Send Gasless

```typescript
try {
  const signature = await sendTransaction(recipientAddress, amount, "USDC", {
    redirectUrl: "lazorkit://transfer/complete",
  });

  // Transaction is now on-chain!
  // Fees were sponsored by Paymaster
  console.log("Transaction signature:", signature);
} catch (error) {
  // Handle errors
}
```

#### Step 5: Track Transaction Status

```typescript
// useWallet provides transaction history
const { transactions } = useWallet();

// Recent transactions are stored and retrieved
transactions.forEach((tx) => {
  console.log(`${tx.type}: ${tx.amount} ${tx.token}`);
  console.log(`Status: ${tx.status}`);
  console.log(`Signature: ${tx.signature}`);
});
```

#### Step 6: Retry on Failure

```typescript
import { retry } from "@/utils/helpers";

const sendWithRetry = async () => {
  try {
    const sig = await retry(
      () => sendTransaction(recipientAddress, amount, "USDC"),
      3, // max attempts
      1000 // delay ms
    );
    return sig;
  } catch (error) {
    // Failed after 3 attempts
  }
};
```

**Key Points:**

- Gasless means **Paymaster covers SOL fees**
- User still pays in USDC (or other token)
- No minimum balance needed for transactions
- Transaction confirms in ~10-15 seconds
- Can check status on Solana Explorer

---

## 🔌 API Reference

### useWallet Hook

The main hook for wallet interactions:

```typescript
const {
  // State
  walletAddress,
  publicKey,
  isConnected,
  isLoading,
  error,

  // Configuration
  network,
  rpcUrl,
  portalUrl,
  paymasterUrl,

  // Operations
  connectWallet,
  disconnectWallet,
  signMessage,
  sendTransaction,

  // History
  transactions,
  lastActivity,
  restoreSession,
  clearSession,
} = useWallet();
```

### WalletProvider Props

```typescript
<WalletProvider network="devnet">{children}</WalletProvider>

// Props:
// - network: 'devnet' | 'mainnet' (default: 'devnet')
```

### Transaction Interface

```typescript
interface Transaction {
  id: string; // Unique transaction ID
  signature: string; // Solana transaction signature
  type: TransactionType; // 'send' | 'receive' | 'swap' | 'billing'
  amount: number; // Amount in token units
  token: string; // Token symbol ('USDC', 'SOL', etc.)
  recipient?: string; // Recipient address
  timestamp: number; // Unix timestamp
  status: TxStatus; // 'pending' | 'confirmed' | 'failed'
}
```

### sendTransaction Function

```typescript
const signature = await sendTransaction(
  recipient: string,           // Solana address
  amount: number,              // Amount in token units
  token: string,               // 'USDC' | 'SOL' | etc.
  options?: {
    redirectUrl?: string;      // Deep link after signing
  }
): Promise<string>             // Transaction signature
```

## 🐛 Troubleshooting

### Issue: "Wallet not connected"

**Cause:** User hasn't authenticated yet.

**Solution:**

```typescript
if (!isConnected) {
  await connectWallet();
}
```

### Issue: "Biometric authentication failed"

**Cause:** Device doesn't have biometrics setup or user cancelled.

**Solution:**

```typescript
try {
  await connectWallet();
} catch (error) {
  if (error.message.includes("biometric")) {
    // Show setup instructions
    Alert.alert("Setup Required", "Enable FaceID/TouchID in Settings");
  }
}
```

### Issue: "Insufficient balance" on gasless transaction

**Cause:** User's smart wallet balance is below transaction amount.

**Solution:**

```typescript
// Check balance before sending
if (amount > MOCK_USDC_BALANCE) {
  Alert.alert("Insufficient Balance", "Not enough USDC");
  return;
}
```

### Issue: Transaction "pending" for too long

**Cause:** Network congestion or failed confirmation.

**Solution:**

```typescript
import { retry } from "@/utils/helpers";

const signature = await retry(
  () => sendTransaction(address, amount, "USDC"),
  3, // retry 3 times
  2000 // with 2 second delay
);
```

### Issue: Deep links not working

**Cause:** Scheme not properly configured.

**Solution:**

For iOS (app.json):

```json
{
  "scheme": "lazorkit",
  "ios": {
    "deeplinks": true
  }
}
```

For Android (AndroidManifest.xml is auto-generated by Expo Router):

```bash
eas build --platform android
```

## 🔐 Security Considerations

1. **Passkeys are Hardware-Bound**

   - Never exported from device
   - Protected by Secure Enclave
   - Require biometric to use

2. **Session Management**

   ```typescript
   // Sessions auto-clear after 1 hour
   LAZORKIT_CONFIG.security.sessionTimeout = 3600000;
   ```

3. **Transaction Validation**

   ```typescript
   // Always validate addresses before sending
   if (!isValidSolanaAddress(recipient)) {
     throw new Error("Invalid recipient");
   }
   ```

4. **Secure Storage**
   ```typescript
   // Uses Expo SecureStore (encrypted)
   await SecureStore.setItemAsync("key", "value");
   ```

## 📚 Additional Resources

- **Lazorkit Docs:** https://docs.lazorkit.com/
- **Lazorkit GitHub:** https://github.com/lazor-kit/lazor-kit
- **Solana Docs:** https://docs.solana.com/
- **Expo Documentation:** https://docs.expo.dev/
- **Telegram Community:** https://t.me/lazorkit

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## ⭐ Support

If this example helped you, please:

- ⭐ Star the repository
- 📢 Share with other developers
- 💬 Provide feedback in Telegram: https://t.me/lazorkit

---

**Built with ❤️ for the Solana community**

_Last Updated: 2025_
