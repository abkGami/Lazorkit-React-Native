# Lazorkit SDK Integration Guide

A complete guide for integrating Lazorkit SDK into React Native applications.

## Table of Contents

1. [What is Lazorkit?](#what-is-lazorkit)
2. [Key Features](#key-features)
3. [Architecture Overview](#architecture-overview)
4. [Installation & Setup](#installation--setup)
5. [Core Concepts](#core-concepts)
6. [Integration Examples](#integration-examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## What is Lazorkit?

Lazorkit is a modern wallet infrastructure for Solana that enables:

- **Passwordless Authentication**: Users authenticate with biometrics (FaceID, TouchID)
- **Smart Wallets**: Programmable accounts with recovery, policies, and session keys
- **Gasless Transactions**: Pay for transactions with any token via Paymaster sponsorship
- **Cross-Device Support**: Restore wallets across devices using iCloud/Google Account

Instead of traditional blockchain UX with seed phrases, users get a familiar mobile experience.

### Use Cases

1. **Consumer Apps**: Gaming, DeFi, payments
2. **Enterprise**: B2B platforms, wallet management
3. **Mobile-First**: App-native crypto experiences
4. **Mass Adoption**: No friction blockchain onboarding

## Key Features

### 1. Passkey Authentication

```
Traditional Wallet Setup:
1. Install MetaMask/Phantom
2. Create new wallet
3. Save 24-word seed phrase
4. Write it down somewhere safe
⏱️ Time: ~10 minutes
❌ Friction: High

Lazorkit Setup:
1. Tap "Create Wallet"
2. Use FaceID/TouchID
3. Done!
⏱️ Time: ~5 seconds
✅ Friction: Minimal
```

**Technical Details:**

- Uses WebAuthn standard (industry standard for passkeys)
- Hardware-bound to device's Secure Enclave
- Never exported or backed up manually
- Automatically syncs to iCloud/Google Account

### 2. Smart Wallets (Program Derived Addresses)

```typescript
// Traditional address
Address: 2x8y3z... (EOA - Externally Owned Account)
Functions: Send/receive SOL and tokens only

// Lazorkit smart wallet
Address: 4a9k2z... (PDA - Program Derived Address)
Functions:
  - Send/receive tokens
  - Enforce spending policies
  - Create/use session keys
  - Recover with backup key
  - Custom application logic
```

**Programmability Features:**

- `Policies`: Set per-token/per-recipient spending limits
- `Recovery`: Regain access if device is lost
- `SessionKeys`: Ephemeral keys for scoped application access
- `Customization`: Add application-specific logic

### 3. Gasless Transactions (Paymaster)

```
User Flow:
1. User creates transaction
2. App contacts Paymaster
3. Paymaster validates transaction
4. Paymaster sponsors SOL fees
5. User signs with passkey
6. Transaction executes
7. User's balance = original - amount (no SOL fee)

Result: Seamless UX, no need to acquire SOL
```

**Economics:**

- Developer/protocol pays for user transactions
- Reduces friction for onboarding
- Can be monetized via subscription/premium features

### 4. Cross-Device Recovery

```
Scenario 1: Lost Device
- User's iPhone breaks
- Gets new iPhone
- Signs in with same iCloud account
- Passkey automatically restored from iCloud
- Can use wallet immediately

Scenario 2: Multiple Devices
- Create wallet on iPhone
- Sign in on iPad with same Apple ID
- Passkey available on both devices
- Same wallet, same address on both
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         React Native App (Expo)                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  UI Components                                 │ │
│  │  - AuthenticationScreen                        │ │
│  │  - GaslessTransferScreen                       │ │
│  │  - WalletDashboard                             │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │  WalletContext (State Management)              │ │
│  │  - walletAddress, isConnected, transactions   │ │
│  │  - connectWallet(), sendTransaction()          │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  Lazorkit SDK (@lazorkit/wallet-mobile-adapter)    │
│  - Passkey generation & signing                    │
│  - Smart wallet account management                 │
│  - Transaction building & simulation               │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  Backend Services                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ Lazorkit     │ │ Paymaster    │ │ Solana     │ │
│  │ Portal       │ │ Service      │ │ RPC        │ │
│  │              │ │              │ │            │ │
│  │ - Key mgmt   │ │ - Fee sponsor│ │ - Mainnet  │ │
│  │ - Simulation │ │ - Validation │ │ - Devnet   │ │
│  └──────────────┘ └──────────────┘ └────────────┘ │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  Solana Blockchain                                  │
│  - Smart Wallet Account (PDA)                       │
│  - Transaction Confirmation                         │
│  - Balance & Token Updates                          │
└─────────────────────────────────────────────────────┘
```

## Installation & Setup

### Prerequisites

```bash
# Check versions
node --version      # v18+ required
npm --version       # 8+
expo --version      # latest
```

### Step 1: Create Expo Project (if starting fresh)

```bash
npx create-expo-app lazor-kit
cd lazor-kit
```

### Step 2: Install Lazorkit SDK

```bash
npm install @lazorkit/wallet-mobile-adapter
npm install @solana/web3.js zustand expo-secure-store
```

### Step 3: Install Peer Dependencies

```bash
npm install expo-router expo-linking expo-web-browser
npm install @react-navigation/native react-native-safe-area-context
npm install @react-navigation/bottom-tabs
```

### Step 4: Configure app.json

```json
{
  "expo": {
    "scheme": "lazorkit",
    "plugins": [
      ["expo-router"],
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

### Step 5: Configure Deep Links

Create `app/_layout.tsx`:

```typescript
import { WalletProvider } from "@/context/WalletContext";

export default function RootLayout() {
  return (
    <WalletProvider network="devnet">{/* Your navigation */}</WalletProvider>
  );
}
```

### Step 6: Create Environment File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure for your network:

```env
EXPO_PUBLIC_NETWORK=devnet
EXPO_PUBLIC_PORTAL_URL=https://portal.lazor.sh
EXPO_PUBLIC_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com
```

### Step 7: Run on Device/Simulator

```bash
# Start Expo development server
npm start

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android

# Physical device (scan QR with Expo Go)
npx expo start
```

## Core Concepts

### Passkey Authentication

**What:** WebAuthn credential stored in device hardware

**Where:** Secure Enclave (iOS) or Strongbox (Android)

**When:** Created during wallet setup, used for every transaction

**How:**

1. User taps "Create Wallet"
2. System shows biometric prompt
3. User authenticates (FaceID/TouchID)
4. Passkey created and stored in Secure Enclave
5. Public key sent to Lazorkit to create smart wallet
6. Private key never leaves device

```typescript
// From user perspective
const { connectWallet } = useWallet();
await connectWallet(); // Triggers FaceID/TouchID
// Done! Wallet is created
```

### Smart Wallet Address

**Format:** Program Derived Address (PDA)

**Example:** `8kB2z4k9z...` (44 character base58)

**Purpose:** On-chain account controlled by Lazorkit program

**Unique per user:** Derived from user's passkey public key

```typescript
// Each user gets unique address
const { walletAddress } = useWallet();
console.log(walletAddress); // 8kB2z4k9z...
```

### Transactions Flow

```
User initiates send:
  ↓
Input validation:
  - Recipient address valid?
  - Amount less than balance?
  - Paymaster can sponsor?
  ↓
Create transaction:
  - Token transfer instruction
  - Compute budget instruction
  - Fee payer setup
  ↓
Simulate on Paymaster:
  - Verify transaction would succeed
  - Calculate exact fee
  - Get sponsorship approval
  ↓
User signs with passkey:
  - Biometric prompt
  - Transaction signed in hardware
  ↓
Submit to Solana:
  - Send signed transaction
  - Wait for confirmation
  ↓
Confirm & update UI:
  - Show success/error
  - Update balance
  - Add to history
```

### Session Management

**Automatic Persistence:**

- Wallet address saved to SecureStore
- Transaction history cached
- Session survives app restart

**Session Timeout:**

- Default: 1 hour
- Configurable per app
- User must re-authenticate

**Cross-Device Sync:**

- iCloud Keychain (iOS)
- Google Password Manager (Android)
- Automatic passkey sync

## Integration Examples

### Example 1: Add Wallet Connection to Existing App

```typescript
// 1. Wrap app with WalletProvider
import { WalletProvider } from "./context/WalletContext";

export default function App() {
  return (
    <WalletProvider network="devnet">
      <YourApp />
    </WalletProvider>
  );
}

// 2. Use wallet in component
import { useWallet } from "./context/WalletContext";

export function WalletButton() {
  const { connectWallet, isConnected, walletAddress } = useWallet();

  return (
    <TouchableOpacity onPress={connectWallet}>
      <Text>
        {isConnected
          ? `Connected: ${walletAddress?.slice(0, 8)}...`
          : "Connect"}
      </Text>
    </TouchableOpacity>
  );
}
```

### Example 2: Send USDC Payment

```typescript
import { useWallet } from "./context/WalletContext";

export function PaymentScreen() {
  const { sendTransaction, isLoading } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const handlePay = async () => {
    try {
      const signature = await sendTransaction(
        recipient,
        parseFloat(amount),
        "USDC",
        { redirectUrl: "myapp://payment/complete" }
      );
      Alert.alert("Success", `Payment sent: ${signature.slice(0, 8)}...`);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Recipient"
        value={recipient}
        onChangeText={setRecipient}
      />
      <TextInput
        placeholder="Amount USDC"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Button
        title={isLoading ? "Sending..." : "Send USDC"}
        onPress={handlePay}
        disabled={isLoading}
      />
    </View>
  );
}
```

### Example 3: Display Transaction History

```typescript
import { useWallet } from "./context/WalletContext";
import { FlatList, Text, View } from "react-native";

export function TransactionHistory() {
  const { transactions } = useWallet();

  return (
    <FlatList
      data={transactions}
      renderItem={({ item }) => (
        <View>
          <Text>
            {item.type}: {item.amount} {item.token}
          </Text>
          <Text>{item.status}</Text>
          <Text>{new Date(item.timestamp).toLocaleDateString()}</Text>
        </View>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}
```

## Best Practices

### 1. Always Validate Input

```typescript
const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

if (!isValidSolanaAddress(recipient)) {
  throw new Error("Invalid recipient address");
}
```

### 2. Handle Errors Gracefully

```typescript
const handleTransaction = async () => {
  try {
    const signature = await sendTransaction(...);
  } catch (error) {
    if (error.message.includes('biometric')) {
      // User denied biometric
      Alert.alert('Authentication cancelled');
    } else if (error.message.includes('insufficient')) {
      // Not enough balance
      Alert.alert('Insufficient balance');
    } else {
      // Network or other error
      Alert.alert('Transaction failed', error.message);
    }
  }
};
```

### 3. Show Loading States

```typescript
const { isLoading, sendTransaction } = useWallet();

<TouchableOpacity disabled={isLoading} onPress={handleSend}>
  {isLoading ? <ActivityIndicator /> : <Text>Send</Text>}
</TouchableOpacity>;
```

### 4. Retry Failed Transactions

```typescript
const retry = async (fn, maxAttempts = 3) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
};

const signature = await retry(
  () => sendTransaction(recipient, amount, "USDC"),
  3
);
```

### 5. Cache and Sync Data

```typescript
// Cache transaction history locally
const [transactions, setTransactions] = useState<Transaction[]>([]);

// Sync with blockchain periodically
useEffect(() => {
  const syncData = async () => {
    const latest = await fetchTransactionHistory();
    setTransactions(latest);
  };

  // Sync on app focus
  const subscription = AppState.addEventListener("change", syncData);

  return () => subscription.remove();
}, [walletAddress]);
```

## Troubleshooting

### Problem: "Wallet not connected"

**Cause:** User hasn't authenticated yet

**Solution:**

```typescript
if (!isConnected) {
  await connectWallet();
}
```

### Problem: Biometric fails on Android

**Cause:** Biometric not set up or incompatible device

**Solution:**

```bash
# Enable biometrics in emulator
# Settings → Biometrics → Enable
# Or use physical device with biometric
```

### Problem: Paymaster returns "sponsorship unavailable"

**Cause:** Budget exhausted or transaction invalid

**Solution:**

```typescript
// Check Paymaster health first
const health = await checkPaymasterHealth("devnet");
if (!health) {
  Alert.alert("Service unavailable", "Paymaster is down");
}

// Validate transaction
const validation = await validateWithPaymaster(transaction, walletAddress);
if (!validation.sponsorshipAvailable) {
  Alert.alert("Cannot sponsor", validation.error);
}
```

### Problem: "Invalid recipient address"

**Cause:** Address format incorrect

**Solution:**

```typescript
// Validate before sending
const isValid = isValidSolanaAddress(recipient);
if (!isValid) {
  // Show format hint
  Alert.alert("Invalid Address", "Use a valid Solana address (44 chars)");
}
```

### Problem: Transaction pending forever

**Cause:** Network congestion or RPC issues

**Solution:**

```typescript
// Check RPC endpoint
const health = await connection.getHealth();

// Retry with different endpoint
const connection = new Connection(process.env.EXPO_PUBLIC_RPC_URL, "confirmed");

// Monitor transaction status
const checkStatus = setInterval(async () => {
  const status = await connection.getSignatureStatus(signature);
  if (status.value?.confirmationStatus === "finalized") {
    clearInterval(checkStatus);
  }
}, 1000);
```

---

## Next Steps

1. **Read the Tutorials:** [TUTORIALS.md](./TUTORIALS.md)
2. **Review Example Code:** Check component implementations
3. **Deploy to DevNet:** Test with real Solana transactions
4. **Deploy to Testnet:** Validate with higher transaction volume
5. **Production Mainnet:** Launch with proper security audits

## Resources

- **Official Docs:** https://docs.lazorkit.com/
- **GitHub:** https://github.com/lazor-kit/lazor-kit
- **Telegram:** https://t.me/lazorkit
- **Twitter:** https://twitter.com/lazorkit
- **Solana Docs:** https://docs.solana.com/

---

**Happy building! 🚀**
