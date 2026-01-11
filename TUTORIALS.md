# Lazorkit Tutorials

Step-by-step tutorials for implementing Lazorkit features in your React Native app.

---

## Table of Contents

1. [Tutorial 1: Create a Passkey-Based Wallet](#tutorial-1-create-a-passkey-based-wallet)
2. [Tutorial 2: Trigger a Gasless Transaction](#tutorial-2-trigger-a-gasless-transaction)
3. [Tutorial 3: Persist Session Across Devices](#tutorial-3-persist-session-across-devices)

---

## Tutorial 1: Create a Passkey-Based Wallet

Learn how to implement biometric authentication (FaceID/TouchID) for wallet creation.

### What are Passkeys?

Passkeys are cryptographic credentials that replace traditional passwords and seed phrases:

- **Hardware-secured**: Stored in device Secure Enclave (iOS) or Strongbox (Android)
- **Biometric-protected**: Requires FaceID/TouchID to access
- **No seed phrase**: No 12/24 words to backup or lose
- **Cross-device sync**: Automatically synced via iCloud/Google Account

### Step 1: Set Up LazorKitProvider

First, wrap your app with `LazorKitProvider` to enable wallet functionality:

```typescript
// app/_layout.tsx
import "../polyfills"; // Must be first!
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

**What happens:**
1. `LazorKitProvider` initializes the wallet SDK
2. Configures RPC connection to Solana network
3. Sets up Paymaster for gasless transactions
4. Provides `useWallet()` hook to all child components

### Step 2: Create the Authentication Screen

Build a UI for wallet creation with biometric authentication:

```typescript
// components/AuthenticationScreen.tsx
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const AuthenticationScreen: React.FC = () => {
  const { connect } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateWallet = async () => {
    setIsLoading(true);

    try {
      // This triggers the biometric prompt and creates the wallet
      await connect({
        redirectUrl: "lazorkit://",
        onSuccess: (wallet) => {
          console.log("Wallet created:", wallet.smartWallet);
          // Navigation will happen automatically via isConnected state
        },
        onFail: (error) => {
          Alert.alert("Error", error.message);
        },
      });
    } catch (error) {
      Alert.alert("Authentication Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="wallet-outline" size={80} color="#007AFF" />
      
      <Text style={styles.title}>Create Your Wallet</Text>
      <Text style={styles.subtitle}>
        Secured by your fingerprint or face
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateWallet}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="finger-print" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Create with Biometrics</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        Your wallet is secured by your device's biometric authentication.
        No passwords or seed phrases required.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    marginBottom: 40,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  note: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
});
```

### Step 3: Handle Authentication Flow

When the user taps "Create with Biometrics", here's what happens:

```
1. Device shows biometric prompt
   └─ iOS: FaceID or TouchID prompt appears
   └─ Android: Fingerprint or Face unlock prompt

2. User authenticates with biometrics
   └─ System validates biometric data
   └─ Passkey credential is created in Secure Enclave

3. Lazorkit SDK creates smart wallet
   └─ Opens Lazorkit Portal in WebView
   └─ Associates passkey with on-chain wallet (PDA)
   └─ Returns to app via deep link

4. App receives wallet address
   └─ useWallet().isConnected = true
   └─ useWallet().wallet.smartWallet = "ABC123..."
```

### Step 4: Route Based on Connection State

Update your main entry to show the right screen:

```typescript
// app/index.tsx
import { AuthenticationScreen } from "@/components/AuthenticationScreen";
import { WalletDashboard } from "@/components/WalletDashboard";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import React from "react";

export default function Index() {
  const { isConnected } = useWallet();

  // Automatically show dashboard when connected
  return isConnected ? <WalletDashboard /> : <AuthenticationScreen />;
}
```

### Step 5: Display Wallet Info After Connection

Show the wallet address on your dashboard:

```typescript
// components/WalletDashboard.tsx
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import * as Clipboard from "expo-clipboard";

export const WalletDashboard: React.FC = () => {
  const { wallet, disconnect } = useWallet();

  const copyAddress = async () => {
    if (wallet?.smartWallet) {
      await Clipboard.setStringAsync(wallet.smartWallet);
      Alert.alert("Copied!", "Wallet address copied to clipboard");
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    // App will automatically return to AuthenticationScreen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Wallet</Text>
      
      <TouchableOpacity onPress={copyAddress} style={styles.addressCard}>
        <Text style={styles.address}>
          {wallet?.smartWallet?.slice(0, 8)}...{wallet?.smartWallet?.slice(-8)}
        </Text>
        <Ionicons name="copy-outline" size={20} color="#007AFF" />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectBtn}>
        <Text style={styles.disconnectText}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Biometric not available" | Device has no biometrics | Enable FaceID/TouchID in Settings |
| "User cancelled" | User dismissed biometric prompt | Show retry button |
| "Network error" | No internet connection | Check connectivity and retry |
| "Unmatched route" | Deep link not configured | Add `+not-found.tsx` catch-all route |

---

## Tutorial 2: Trigger a Gasless Transaction

Learn how to send USDC without the user needing SOL for fees.

### What is Gasless?

Gasless transactions mean the **Paymaster** sponsors Solana network fees:

```
Traditional Transaction:
├─ User has: 100 USDC, 0 SOL
├─ Wants to send: 50 USDC
├─ Problem: ❌ Needs ~0.00025 SOL for fees
└─ Result: Transaction fails

Gasless Transaction (Lazorkit):
├─ User has: 100 USDC, 0 SOL
├─ Wants to send: 50 USDC
├─ Paymaster pays: 0.00025 SOL fee
└─ Result: ✅ Transaction succeeds, user has 50 USDC left
```

### Step 1: Create Transfer Form

Build a form to collect transfer details:

```typescript
// components/GaslessTransferScreen.tsx
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";

export const GaslessTransferScreen: React.FC = () => {
  const { signAndExecuteTransaction, wallet } = useWallet();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send USDC</Text>

      <TextInput
        style={styles.input}
        placeholder="Recipient address"
        value={recipient}
        onChangeText={setRecipient}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      {/* Gasless indicator */}
      <View style={styles.gaslessCard}>
        <Text style={styles.gaslessText}>
          ⚡ Network fees sponsored by Lazorkit
        </Text>
      </View>

      <TouchableOpacity
        style={styles.sendButton}
        onPress={handleSend}
        disabled={isLoading}
      >
        <Text style={styles.sendButtonText}>
          {isLoading ? "Sending..." : "Send USDC"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Step 2: Validate Input

Add validation before sending:

```typescript
const validateInput = (): boolean => {
  // Check recipient address
  if (!recipient.trim()) {
    Alert.alert("Error", "Please enter a recipient address");
    return false;
  }

  // Validate Solana address format (base58, 32-44 chars)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipient)) {
    Alert.alert("Error", "Invalid Solana address");
    return false;
  }

  // Check amount
  if (!amount.trim() || parseFloat(amount) <= 0) {
    Alert.alert("Error", "Please enter a valid amount");
    return false;
  }

  return true;
};
```

### Step 3: Build and Send Transaction

Execute the gasless transfer:

```typescript
import { 
  Connection, 
  PublicKey, 
  Transaction,
  TransactionInstruction 
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// USDC Mint on Devnet
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

const handleSend = async () => {
  if (!validateInput()) return;

  setIsLoading(true);

  try {
    const connection = new Connection("https://api.devnet.solana.com");
    const senderPubkey = new PublicKey(wallet.smartWallet);
    const recipientPubkey = new PublicKey(recipient);

    // Get token accounts
    const senderTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      senderPubkey
    );
    const recipientTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      recipientPubkey
    );

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      senderPubkey,
      parseFloat(amount) * 1_000_000, // USDC has 6 decimals
      [],
      TOKEN_PROGRAM_ID
    );

    // Build transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = senderPubkey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    // Send via Lazorkit (Paymaster sponsors the fee)
    const signature = await signAndExecuteTransaction({
      transaction,
      redirectUrl: "lazorkit://",
    });

    Alert.alert(
      "Success!",
      `Transaction sent!\n\nSignature: ${signature.slice(0, 20)}...`
    );

    // Clear form
    setRecipient("");
    setAmount("");
  } catch (error) {
    Alert.alert("Transfer Failed", error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### Step 4: Show Transaction Status

Display confirmation to the user:

```typescript
const [txSignature, setTxSignature] = useState<string | null>(null);

// After successful send
setTxSignature(signature);

// Display link to explorer
{txSignature && (
  <View style={styles.successCard}>
    <Text style={styles.successText}>✅ Transaction Confirmed!</Text>
    <TouchableOpacity
      onPress={() =>
        Linking.openURL(
          `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
        )
      }
    >
      <Text style={styles.explorerLink}>View on Explorer →</Text>
    </TouchableOpacity>
  </View>
)}
```

### How Paymaster Works (Behind the Scenes)

```
1. App builds transaction
   └─ Transfer instruction with sender, recipient, amount

2. Transaction sent to Lazorkit SDK
   └─ SDK contacts Paymaster service

3. Paymaster validates & sponsors
   └─ Checks transaction is valid
   └─ Adds fee payment instruction
   └─ Returns sponsored transaction

4. User signs with passkey
   └─ Biometric prompt appears
   └─ Transaction signed in Secure Enclave

5. Transaction submitted to Solana
   └─ Paymaster pays the SOL fee
   └─ User's USDC is transferred
```

---

## Tutorial 3: Persist Session Across Devices

Learn how to restore wallets on new devices using passkey sync.

### How Session Persistence Works

Passkeys sync automatically through platform cloud services:

```
iOS:
└─ Passkeys stored in iCloud Keychain
└─ Synced to all devices with same Apple ID
└─ Requires Face ID/Touch ID on new device

Android:
└─ Passkeys stored in Google Password Manager
└─ Synced to all devices with same Google Account
└─ Requires biometric on new device
```

### Step 1: Automatic Session Restoration

The Lazorkit SDK handles session restoration automatically:

```typescript
// app/index.tsx
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isConnected, wallet } = useWallet();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    // SDK automatically checks for existing session
    // Wait briefly to allow restoration
    const timer = setTimeout(() => {
      setIsRestoring(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking session
  if (isRestoring) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Checking wallet...</Text>
      </View>
    );
  }

  return isConnected ? <WalletDashboard /> : <AuthenticationScreen />;
}
```

### Step 2: Manual Wallet Restoration

For explicit "Restore Wallet" functionality:

```typescript
// components/AuthenticationScreen.tsx
const handleRestoreWallet = async () => {
  setIsLoading(true);

  try {
    // Connect will detect existing passkey and restore
    await connect({
      redirectUrl: "lazorkit://",
      onSuccess: (wallet) => {
        console.log("Wallet restored:", wallet.smartWallet);
      },
      onFail: (error) => {
        Alert.alert("Restore Failed", error.message);
      },
    });
  } catch (error) {
    Alert.alert("Error", "Could not restore wallet. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

// Add restore button to UI
<TouchableOpacity
  style={styles.secondaryButton}
  onPress={handleRestoreWallet}
>
  <Text style={styles.secondaryButtonText}>
    Restore Existing Wallet
  </Text>
</TouchableOpacity>
```

### Step 3: Persist Additional Data

Store transaction history and preferences with SecureStore:

```typescript
import * as SecureStore from "expo-secure-store";

// Save transaction history
const saveTransactionHistory = async (transactions: Transaction[]) => {
  await SecureStore.setItemAsync(
    "transaction_history",
    JSON.stringify(transactions)
  );
};

// Load transaction history
const loadTransactionHistory = async (): Promise<Transaction[]> => {
  const stored = await SecureStore.getItemAsync("transaction_history");
  return stored ? JSON.parse(stored) : [];
};

// Save user preferences
const savePreferences = async (prefs: { theme: string; notifications: boolean }) => {
  await SecureStore.setItemAsync("user_preferences", JSON.stringify(prefs));
};

// Load on app start
useEffect(() => {
  const loadData = async () => {
    const history = await loadTransactionHistory();
    setTransactions(history);
  };
  loadData();
}, []);
```

### Step 4: Handle Session Expiry

Gracefully handle expired or invalid sessions:

```typescript
const checkSessionValidity = async () => {
  try {
    // Try a simple operation to verify session
    if (wallet?.smartWallet) {
      const connection = new Connection("https://api.devnet.solana.com");
      await connection.getBalance(new PublicKey(wallet.smartWallet));
      return true;
    }
    return false;
  } catch (error) {
    console.log("Session may be invalid:", error);
    return false;
  }
};

// Check session on app foreground
useEffect(() => {
  const subscription = AppState.addEventListener("change", async (state) => {
    if (state === "active" && isConnected) {
      const valid = await checkSessionValidity();
      if (!valid) {
        // Session expired, prompt re-authentication
        Alert.alert(
          "Session Expired",
          "Please authenticate again to continue.",
          [{ text: "OK", onPress: () => disconnect() }]
        );
      }
    }
  });

  return () => subscription?.remove();
}, [isConnected]);
```

### Cross-Device Restoration Flow

```
Device A (Original):
1. User creates wallet with passkey
2. Passkey synced to iCloud/Google

Device B (New):
1. User installs app
2. App shows "Restore Wallet" option
3. User taps restore
4. Device shows passkey picker (system UI)
5. User selects their passkey
6. Biometric authentication
7. Wallet restored with same address!
```

### Testing Session Persistence

1. Create wallet on Device A
2. Note the wallet address
3. Install app on Device B (same Apple ID / Google Account)
4. Tap "Restore Existing Wallet"
5. Verify same wallet address appears

---

## Summary

You've learned how to:

1. **Create passkey-based wallets** with biometric authentication
2. **Send gasless transactions** using the Paymaster service
3. **Persist sessions** across devices using passkey sync

For more information:
- [Lazorkit Documentation](https://docs.lazorkit.com)
- [GitHub Repository](https://github.com/lazor-kit)
- [Solana Documentation](https://docs.solana.com)
