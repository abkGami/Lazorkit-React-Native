# Lazorkit React Native Example

A production-ready example demonstrating **Lazorkit SDK** integration for building passwordless, gasless Solana mobile applications with React Native.

## 🚀 Project Overview

This example app showcases how to build a modern Solana wallet using Lazorkit SDK with:

- **🔐 Passkey Authentication** - Biometric login (FaceID/TouchID) with no seed phrases
- **⚡ Gasless Transactions** - Send tokens without holding SOL for fees
- **💼 Smart Wallets** - Programmable accounts with cross-device recovery
- **📱 Production UI** - Beautiful, responsive mobile interface

### What is Lazorkit?

Lazorkit is a Solana SDK that enables:

- **Passkeys**: Hardware-backed credentials stored in device Secure Enclave
- **Gasless Transactions**: Paymaster service sponsors network fees
- **Smart Wallets**: PDA-based accounts with programmable logic

---

## 📁 Project Structure

```
lazor-kit/
├── app/
│   ├── _layout.tsx              # Root layout with LazorKitProvider
│   ├── index.tsx                # Main entry (auth/dashboard router)
│   ├── modal.tsx                # Modal screen
│   └── +not-found.tsx           # Catch-all for deep links
├── components/
│   ├── AuthenticationScreen.tsx # Passkey creation & login UI
│   ├── WalletDashboard.tsx      # Wallet overview & actions
│   ├── GaslessTransferScreen.tsx# USDC gasless transfer form
│   ├── SendTokensModal.tsx      # Token send modal
│   └── ReceiveModal.tsx         # Receive QR code modal
├── context/
│   └── WalletContext.tsx        # Global wallet state management
├── utils/
│   ├── config.ts                # Network & API configuration
│   ├── helpers.ts               # Utility functions
│   └── lazorkit.ts              # SDK initialization helpers
├── polyfills.ts                 # Required crypto polyfills
├── .env.example                 # Environment variables template
└── TUTORIALS.md                 # Step-by-step tutorials
```

---

## ⚙️ SDK Installation & Configuration

### Step 1: Install Dependencies

```bash
# Install Lazorkit SDK and required packages
npm install @lazorkit/wallet-mobile-adapter @solana/web3.js

# Install Expo packages for secure storage and crypto
npx expo install expo-secure-store react-native-get-random-values

# Install buffer polyfill for Solana compatibility
npm install buffer react-native-url-polyfill text-encoding
```

### Step 2: Create Polyfills

Create `polyfills.ts` in your project root:

```typescript
// polyfills.ts - MUST be imported FIRST in _layout.tsx
import "react-native-get-random-values";
import { Buffer } from "buffer";
import "react-native-url-polyfill/auto";

global.Buffer = Buffer;

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = require("text-encoding").TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = require("text-encoding").TextDecoder;
}
```

### Step 3: Configure LazorKitProvider

Wrap your app with `LazorKitProvider` in `app/_layout.tsx`:

```typescript
// CRITICAL: Import polyfills first
import "../polyfills";

import { LazorKitProvider } from "@lazorkit/wallet-mobile-adapter";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <LazorKitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      configPaymaster={{
        paymasterUrl: "https://kora.devnet.lazorkit.com",
      }}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </LazorKitProvider>
  );
}
```

---

## 🌐 Environment Setup

### Step 1: Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 2: Configure Variables

Edit `.env` with your settings:

```env
# Network: devnet (testing) or mainnet (production)
EXPO_PUBLIC_NETWORK=devnet

# Solana RPC Endpoint
EXPO_PUBLIC_RPC_URL=https://api.devnet.solana.com

# Lazorkit Portal (key management)
EXPO_PUBLIC_PORTAL_URL=https://portal.lazor.sh

# Paymaster Service (gasless transactions)
EXPO_PUBLIC_PAYMASTER_URL=https://kora.devnet.lazorkit.com

# Deep link scheme for authentication redirects
EXPO_PUBLIC_DEEP_LINK_SCHEME=lazorkit
```

### Step 3: Configure Deep Linking

In `app.json`, ensure your scheme is set:

```json
{
  "expo": {
    "scheme": "lazorkit",
    "ios": {
      "bundleIdentifier": "com.yourcompany.lazorkit"
    },
    "android": {
      "package": "com.yourcompany.lazorkit"
    }
  }
}
```

---

## 🏃 Running the Example

### Prerequisites

- Node.js v18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/abkGami/Lazorkit-React-Native.git
cd Lazorkit-React-Native

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Start the development server
npm start

# 5. Run on device/emulator
# Press 'a' for Android or 'i' for iOS
```

### Running on Physical Device

```bash
# Android (requires USB debugging enabled)
npm run android

# iOS (requires Xcode on Mac)
npm run ios
```

### Troubleshooting

| Issue                   | Solution                                                 |
| ----------------------- | -------------------------------------------------------- |
| Crypto errors           | Ensure `polyfills.ts` is imported first in `_layout.tsx` |
| Deep link not working   | Check `scheme` in `app.json` matches redirect URL        |
| Build fails             | Run `npx expo prebuild --clean` and rebuild              |
| Biometric not available | Enable FaceID/TouchID in device settings                 |

---

## 💡 Key Code Examples

### Connect Wallet with Passkey

```typescript
import { useWallet } from "@lazorkit/wallet-mobile-adapter";

function ConnectButton() {
  const { connect, isConnected, wallet } = useWallet();

  const handleConnect = async () => {
    await connect({
      redirectUrl: "lazorkit://",
      onSuccess: (wallet) => {
        console.log("Connected:", wallet.smartWallet);
      },
      onFail: (error) => {
        console.error("Failed:", error);
      },
    });
  };

  if (isConnected) {
    return <Text>Connected: {wallet?.smartWallet}</Text>;
  }

  return <Button title="Create Wallet" onPress={handleConnect} />;
}
```

### Send Gasless Transaction

```typescript
import { useWallet } from "@lazorkit/wallet-mobile-adapter";

function SendButton() {
  const { signAndExecuteTransaction, wallet } = useWallet();

  const sendUSDC = async (recipient: string, amount: number) => {
    // Transaction is automatically sponsored by Paymaster
    const signature = await signAndExecuteTransaction({
      transaction: buildTransferTransaction(recipient, amount),
      redirectUrl: "lazorkit://",
    });

    console.log("Transaction sent:", signature);
  };

  return <Button title="Send USDC" onPress={() => sendUSDC(address, 10)} />;
}
```

### Check Wallet Connection

```typescript
import { useWallet } from "@lazorkit/wallet-mobile-adapter";

function App() {
  const { isConnected } = useWallet();

  return isConnected ? <WalletDashboard /> : <AuthenticationScreen />;
}
```

---

## 📚 Tutorials

For detailed step-by-step guides, see [TUTORIALS.md](TUTORIALS.md):

1. **[Create a Passkey Wallet](TUTORIALS.md#tutorial-1-create-a-passkey-based-wallet)** - Set up biometric authentication
2. **[Send Gasless Transactions](TUTORIALS.md#tutorial-2-trigger-a-gasless-transaction)** - Transfer tokens without SOL fees
3. **[Persist Sessions](TUTORIALS.md#tutorial-3-persist-session-across-devices)** - Restore wallet on new devices

---

## 🔧 Configuration Options

### LazorKitProvider Props

| Prop                           | Type     | Description                                |
| ------------------------------ | -------- | ------------------------------------------ |
| `rpcUrl`                       | `string` | Solana RPC endpoint                        |
| `portalUrl`                    | `string` | Lazorkit portal for key management         |
| `configPaymaster.paymasterUrl` | `string` | Paymaster service for gasless transactions |

### Network Endpoints

| Network | RPC URL                               | Paymaster                           |
| ------- | ------------------------------------- | ----------------------------------- |
| Devnet  | `https://api.devnet.solana.com`       | `https://kora.devnet.lazorkit.com`  |
| Mainnet | `https://api.mainnet-beta.solana.com` | Contact Lazorkit for mainnet access |

---

## 📖 Resources

- **Lazorkit Documentation**: [https://docs.lazorkit.com](https://docs.lazorkit.com)
- **Lazorkit GitHub**: [https://github.com/lazor-kit](https://github.com/lazor-kit)
- **Solana Docs**: [https://docs.solana.com](https://docs.solana.com)
- **Expo Docs**: [https://docs.expo.dev](https://docs.expo.dev)

---

## 📝 License

MIT License - see LICENSE file for details.
