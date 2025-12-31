# Lazorkit React Native - Quick Start Guide

Get a working Lazorkit wallet running in 10 minutes.

## � Prerequisites

Before you start, make sure you have:

1. **Node.js installed** (v18 or higher)

   - Check: `node --version`
   - Download from: https://nodejs.org/

2. **An Expo project** or React Native project with Expo Router

   - If starting fresh: `npx create-expo-app@latest my-app --template tabs`
   - This guide assumes Expo Router with tabs template

3. **iOS Simulator** (Mac) or **Android Emulator** (Windows/Mac/Linux)

   - iOS: Install Xcode from App Store
   - Android: Install Android Studio

4. **Expo CLI** (installed automatically with npx)

## 🚀 Setup Steps

### Step 1: Create WalletContext File (2 min)

First, create the wallet context file that manages your wallet state.

**Create the file: `context/WalletContext.tsx`**

Copy the complete WalletContext implementation from [context/WalletContext.tsx](context/WalletContext.tsx) in this project.

**What this file does:**

- Manages wallet connection state
- Handles transactions
- Persists sessions with SecureStore
- Configures network (devnet/mainnet)

**If you're in this project:** The file already exists, you can skip this step.

**If you're starting fresh:** Copy the entire [WalletContext.tsx](context/WalletContext.tsx) file to your project's `context/` folder.

### Step 2: Install Required Dependencies (1 min)

Open your terminal in the project root and run:

```bash
npx expo install expo-secure-store @solana/web3.js
npm install @lazorkit/wallet-mobile-adapter
```

**What these packages do:**

- `expo-secure-store`: Securely stores wallet data on device
- `@solana/web3.js`: Solana blockchain interaction library
- `@lazorkit/wallet-mobile-adapter`: Lazorkit wallet SDK for mobile

**Verification:**
After installation, check `package.json` to confirm all packages are listed in dependencies.

### Step 3: Wrap App with WalletProvider (2 min)

Open your root layout file and wrap your app with the WalletProvider.

**File: `app/_layout.tsx`**

```typescript
import { Stack } from "expo-router";
import { WalletProvider } from "@/context/WalletContext";

export default function RootLayout() {
  return (
    <WalletProvider network="devnet">
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </WalletProvider>
  );
}
```

**Important notes:**

- Import `WalletProvider` from your context folder
- Use `network="devnet"` for testing (free transactions)
- The provider must wrap your entire navigation structure
- Keep existing Stack/navigation components inside the provider

### Step 4: Create Connect Wallet Component (3 min)

Create a reusable wallet connection button.

**Create file: `components/WalletConnect.tsx`**

```typescript
import React from "react";
import { useWallet } from "@/context/WalletContext";
import { TouchableOpacity, Text, Alert, StyleSheet } from "react-native";

export function WalletConnect() {
  const { connectWallet, isConnected, walletAddress, isLoading } = useWallet();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      Alert.alert("Connection Error", error.message);
    }
  };

  if (isConnected) {
    return (
      <Text style={styles.connectedText}>
        Connected: {walletAddress?.slice(0, 8)}...
      </Text>
    );
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleConnect}
      disabled={isLoading}
    >
      <Text style={styles.buttonText}>
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  connectedText: {
    fontSize: 14,
    color: "#666",
  },
});
```

**What this component does:**

- Shows "Connect Wallet" button when not connected
- Shows wallet address when connected
- Handles loading states
- Shows error alerts if connection fails

### Step 5: Add to Your Home Screen (2 min)

Now use the WalletConnect component in your app's home screen.

**File: `app/(tabs)/index.tsx`**

```typescript
import { View, Text, StyleSheet } from "react-native";
import { WalletConnect } from "@/components/WalletConnect";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Lazorkit App</Text>
      <Text style={styles.subtitle}>Connect your wallet to get started</Text>
      <WalletConnect />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
});
```

### Step 6: Run Your App! (1 min)

Start the development server:

```bash
npx expo start
```

**Then choose your platform:**

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

**What you should see:**

- Your app loads with "My Lazorkit App" text
- A blue "Connect Wallet" button
- When clicked, wallet connects and shows address

---

## ✅ Verification Checklist

Make sure everything is working:

- [ ] App starts without errors
- [ ] You can see the "Connect Wallet" button
- [ ] Clicking the button connects the wallet
- [ ] Wallet address is displayed after connecting
- [ ] No red error messages in terminal or app

**Common issues:**

- **"Cannot find module"**: Run `npx expo install expo-secure-store` again
- **Red screen errors**: Check that WalletContext.tsx file exists
- **Button doesn't work**: Check console logs for errors

---

## 🎯 What You've Built

Congratulations! You now have:

✅ A working Solana wallet in your React Native app
✅ Passkey authentication (biometric/FaceID)
✅ Secure session storage
✅ Ready for gasless transactions

---

## 📱 Next: Add Features

Now that your wallet is connected, add these features:

### Feature 1: Send USDC Transactions

**Create file: `components/SendUSDC.tsx`**

```typescript
import React from "react";
import { TouchableOpacity, Text, Alert, StyleSheet } from "react-native";
import { useWallet } from "@/context/WalletContext";

export function SendUSDC() {
  const { sendTransaction, isLoading } = useWallet();

  const handleSend = async () => {
    try {
      const signature = await sendTransaction(
        "RECIPIENT_ADDRESS_HERE", // Replace with actual Solana address
        100, // Amount in USDC
        "USDC" // Token type
      );
      Alert.alert("Success!", `Transaction sent: ${signature}`);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleSend}
      disabled={isLoading}
    >
      <Text style={styles.buttonText}>
        {isLoading ? "Sending..." : "Send 100 USDC"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#34C759",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

**Add to your screen:**

```typescript
import { SendUSDC } from "@/components/SendUSDC";

// In your component:
<WalletConnect />
<SendUSDC />
```

### Feature 2: Display Wallet Balance

**Create file: `components/WalletBalance.tsx`**

```typescript
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useWallet } from "@/context/WalletContext";
import { Connection, PublicKey } from "@solana/web3.js";

export function WalletBalance() {
  const { walletAddress, rpcUrl } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress]);

  const fetchBalance = async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const connection = new Connection(rpcUrl);
      const publicKey = new PublicKey(walletAddress);

      // Get SOL balance
      const lamports = await connection.getBalance(publicKey);
      const sol = lamports / 1000000000; // Convert lamports to SOL
      setBalance(sol);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!walletAddress) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Balance</Text>
      <Text style={styles.balance}>
        {loading ? "Loading..." : `${balance.toFixed(4)} SOL`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginVertical: 10,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  balance: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
});
```

### Feature 3: View Transaction History

**Create file: `components/TransactionList.tsx`**

```typescript
import React from "react";
import { useWallet } from "@/context/WalletContext";
import { FlatList, View, Text, StyleSheet } from "react-native";

export function TransactionList() {
  const { transactions } = useWallet();

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No transactions yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      style={styles.list}
      renderItem={({ item }) => (
        <View style={styles.transaction}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionType}>{item.type}</Text>
            <Text style={styles.transactionStatus}>{item.status}</Text>
          </View>
          <Text style={styles.transactionAmount}>
            {item.amount} {item.token}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 10,
  },
  transaction: {
    padding: 15,
    backgroundColor: "white",
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  transactionStatus: {
    fontSize: 12,
    color: "#34C759",
    textTransform: "uppercase",
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 12,
    color: "#666",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
});
```

---

## 🔧 Configuration & Customization

### Check if Wallet is Connected

```typescript
const { isConnected } = useWallet();

if (isConnected) {
  // Show wallet UI
} else {
  // Show connect button
}
```

### Get Current Balance

```typescript
const { walletAddress } = useWallet();
const [balance, setBalance] = useState(0);

useEffect(() => {
  if (walletAddress) {
    const connection = new Connection("https://api.devnet.solana.com");
    const mint = new PublicKey("EPjFWdd5Au57nqb255heH41CvqAstksNQm7meWsan5");

    connection
      .getParsedTokenAccountsByOwner(new PublicKey(walletAddress), { mint })
      .then((response) => {
        const amount =
          response.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
        setBalance(amount);
      });
  }
}, [walletAddress]);
```

### Validate Recipient Address

```typescript
import { PublicKey } from "@solana/web3.js";

const isValidAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Use in form validation
if (!isValidAddress(recipient)) {
  Alert.alert("Invalid address format");
}
```

### Copy Address to Clipboard

```typescript
import { useWallet } from "@/context/WalletContext";
import { Share } from "react-native";

export function CopyAddress() {
  const { walletAddress } = useWallet();

  const handleCopy = async () => {
    await Share.share({
      message: walletAddress || "",
      title: "My Wallet Address",
    });
  };

  return <Button title="Share Address" onPress={handleCopy} />;
}
```

### Handle Biometric Errors

```typescript
const handleConnect = async () => {
  try {
    await connectWallet();
  } catch (error) {
    const message = error.message;

    if (message.includes("biometric")) {
      Alert.alert("Setup Required", "Enable FaceID or TouchID in Settings");
    } else if (message.includes("cancelled")) {
      Alert.alert("Cancelled", "You cancelled authentication");
    } else if (message.includes("network")) {
      Alert.alert("Network Error", "Check your internet connection");
    } else {
      Alert.alert("Error", message);
    }
  }
};
```

---

## 🔧 Configuration

### Switch Networks (DevNet vs MainNet)

**DevNet** (for testing - free):

```typescript
<WalletProvider network="devnet">
```

**MainNet** (for production - real money):

```typescript
<WalletProvider network="mainnet">
```

**Important:** Always test on DevNet first before deploying to MainNet!

### Optional: Environment Variables

Create `.env` file for custom configuration:

```env
EXPO_PUBLIC_NETWORK=devnet
EXPO_PUBLIC_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_PORTAL_URL=https://portal.lazor.sh
EXPO_PUBLIC_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com
```

Then install dotenv support:

```bash
npm install react-native-dotenv
```

---

## 🎯 Common Tasks & Patterns

---

## 📚 Full Examples

### Complete Payment Component

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useWallet } from "@/context/WalletContext";
import { PublicKey } from "@solana/web3.js";

export function PaymentComponent() {
  const { sendTransaction, isLoading, walletAddress } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const validateAndSend = async () => {
    // Validate recipient
    try {
      new PublicKey(recipient);
    } catch {
      Alert.alert("Invalid recipient address");
      return;
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid amount");
      return;
    }

    // Send transaction
    setProcessing(true);
    try {
      const signature = await sendTransaction(recipient, numAmount, "USDC");
      Alert.alert("Success", `Transaction: ${signature.slice(0, 20)}...`);
      setRecipient("");
      setAmount("");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!walletAddress) {
    return <Text>Please connect wallet first</Text>;
  }

  return (
    <View>
      <Text>Send USDC</Text>

      <TextInput
        placeholder="Recipient address"
        value={recipient}
        onChangeText={setRecipient}
        editable={!processing}
      />

      <TextInput
        placeholder="Amount USDC"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        editable={!processing}
      />

      <TouchableOpacity
        onPress={validateAndSend}
        disabled={processing || !recipient || !amount}
      >
        {processing ? <ActivityIndicator /> : <Text>Send USDC</Text>}
      </TouchableOpacity>
    </View>
  );
}
```

### Complete Wallet Dashboard

```typescript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useWallet } from "@/context/WalletContext";

export function WalletDashboard() {
  const { walletAddress, isConnected, transactions, disconnectWallet } =
    useWallet();
  const [balance, setBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Re-fetch balance and transactions
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  if (!isConnected) {
    return <Text>Not connected</Text>;
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Wallet Info */}
      <View>
        <Text>Your Wallet</Text>
        <Text>{walletAddress}</Text>
        <Text>Balance: {balance} USDC</Text>
      </View>

      {/* Transaction History */}
      <Text>Recent Transactions</Text>
      <FlatList
        data={transactions}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View>
            <Text>
              {item.type}: {item.amount} {item.token}
            </Text>
            <Text>{item.status}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Disconnect */}
      <TouchableOpacity onPress={disconnectWallet}>
        <Text>Disconnect</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

---

## 🐛 Troubleshooting & Common Issues

### "Cannot find module 'expo-secure-store'"

**Solution:**

```bash
npx expo install expo-secure-store
```

Then restart your development server: `npx expo start --clear`

### "Cannot find module '@/context/WalletContext'"

**Cause:** The WalletContext.tsx file doesn't exist or the path is wrong.

**Solution:**

1. Make sure `context/WalletContext.tsx` exists in your project
2. Copy the file from this project's [context/WalletContext.tsx](context/WalletContext.tsx)
3. Verify the `@` path alias is configured in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### App crashes on startup

**Cause:** Usually missing dependencies or syntax errors.

**Solution:**

1. Clear cache: `npx expo start --clear`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check terminal for specific error messages

### "Connect Wallet" button doesn't work

**Cause:** Wallet context not properly initialized.

**Solution:**

1. Verify WalletProvider wraps your entire app in `app/_layout.tsx`
2. Check for console errors
3. Make sure `useWallet()` is only used inside components that are children of WalletProvider

### TypeScript errors in WalletContext.tsx

**Cause:** Type declarations not found.

**Solution:**

```bash
npm install --save-dev @types/react @types/react-native
npx expo install expo-secure-store
```

### Wallet connects but balance shows 0

**Cause:** New wallet on devnet has no funds.

**Solution:**

1. Use Solana CLI to airdrop test SOL:

```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

2. Or use the Solana Faucet: https://faucet.solana.com/

### "Network request failed" error

**Cause:** No internet connection or RPC endpoint down.

**Solution:**

1. Check your internet connection
2. Try a different RPC endpoint:

```typescript
<WalletProvider network="devnet">
// Uses default: https://api.devnet.solana.com
```

### Metro bundler issues

**Solution:**

```bash
# Kill all node processes
npx kill-port 8081 19000 19001

# Clear all caches
npx expo start --clear

# If still having issues
rm -rf node_modules .expo .expo-shared
npm install
npx expo start
```

### iOS Simulator not loading

**Solution:**

1. Make sure Xcode is installed
2. Open Xcode → Preferences → Locations → Check Command Line Tools
3. Restart simulator: `xcrun simctl shutdown all && npx expo start --ios`

### Android Emulator not loading

**Solution:**

1. Make sure Android Studio is installed
2. Open Android Studio → AVD Manager → Start an emulator
3. Then run: `npx expo start --android`

---

## 💡 Development Tips

### Enable Hot Reload

Press `r` in terminal to reload app, or shake device and select "Reload"

### View Console Logs

All `console.log()` statements appear in your terminal where you ran `npx expo start`

### Debug Network Requests

Install React Native Debugger or use Flipper:

```bash
npx react-devtools
```

### Enable Debug Logging

```typescript
// In your app
if (__DEV__) {
  // Log wallet state changes
  const { walletAddress, isConnected } = useWallet();
  console.log("Wallet:", { walletAddress, isConnected });
}
```

### Check Transaction Status

```typescript
const checkTransactionStatus = async (signature: string) => {
  const connection = new Connection("https://api.devnet.solana.com");

  const status = await connection.getSignatureStatus(signature);
  console.log("Status:", status);

  if (status.value?.err) {
    console.error("Transaction failed:", status.value.err);
  } else {
    console.log("Transaction confirmed!");
  }
};
```

### Test on Devnet Faucet

```bash
# Get test SOL from faucet
solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet

# Get test USDC from faucet (if available)
# Or use devnet USDC mint: EPjFWdd5Au57nqb255heH41CvqAstksNQm7meWsan5
```

---

## 📖 Learn More

- **Full README:** [README_LAZORKIT.md](README_LAZORKIT.md)
- **Detailed Tutorials:** [TUTORIALS.md](TUTORIALS.md)
- **Integration Guide:** [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- **Official Docs:** https://docs.lazorkit.com/

---

## ❓ FAQ

**Q: Do users need to install another app?**
A: No! Everything is in-app. No MetaMask or Phantom needed.

**Q: Does it work offline?**
A: No, internet connection required for blockchain transactions.

**Q: Can users backup their wallet?**
A: Yes, via iCloud (iOS) or Google Account (Android).

**Q: Is there a wallet fee?**
A: No. The developer can sponsor fees via Paymaster.

**Q: Can I use on MainNet?**
A: Yes, change `network="mainnet"` in WalletProvider.

**Q: How do I test with real transactions?**
A: Use Devnet for free testing, then deploy to MainNet.

---

## 🚀 Deploy to Mainnet

When ready for production:

1. **Change to MainNet:**

   ```typescript
   <WalletProvider network="mainnet">
   ```

2. **Update endpoints:**

   ```env
   EXPO_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
   ```

3. **Security audit:** Get smart contracts reviewed

4. **Launch:** Deploy app to stores

---

## 🤝 Get Help

- **Docs:** https://docs.lazorkit.com/
- **Telegram:** https://t.me/lazorkit
- **GitHub Issues:** https://github.com/lazor-kit/lazor-kit/issues

---

**You're ready! Start building amazing apps on Solana. 🎉**
