# Lazorkit Integration Tutorials

This document contains detailed step-by-step tutorials for implementing Lazorkit features.

## Table of Contents

1. [Tutorial 1: Passkey Wallet Creation & Biometric Login](#tutorial-1-passkey-wallet-creation--biometric-login)
2. [Tutorial 2: Gasless USDC Transfers](#tutorial-2-gasless-usdc-transfers)
3. [Tutorial 3: Session Persistence Across Devices](#tutorial-3-session-persistence-across-devices)
4. [Tutorial 4: Transaction History & Filtering](#tutorial-4-transaction-history--filtering)
5. [Advanced Topics](#advanced-topics)

---

## Tutorial 1: Passkey Wallet Creation & Biometric Login

### What are Passkeys?

Passkeys are cryptographic credentials stored securely on your device:

- **Hardware-bound**: Protected by Secure Enclave (iOS) or Strongbox (Android)
- **Biometric-protected**: Requires FaceID/TouchID to use
- **No seed phrase**: No manual backup or recovery codes
- **Recovery-friendly**: Automatically synced to iCloud/Google Account

### Implementation Steps

#### Step 1.1: Set Up the Wallet Provider

First, wrap your app with `WalletProvider` to enable wallet functionality:

```typescript
// app/_layout.tsx
import { WalletProvider } from "@/context/WalletContext";

export default function RootLayout() {
  return (
    <WalletProvider network="devnet">
      <NavigationContainer>
        <Stack>
          <Stack.Screen name="auth" />
          <Stack.Screen name="wallet" />
        </Stack>
      </NavigationContainer>
    </WalletProvider>
  );
}
```

**What happens:**

1. WalletProvider initializes wallet context
2. Attempts to restore previous session from storage
3. Provides `useWallet()` hook to all child components

#### Step 1.2: Create the Authentication UI

Build a beautiful authentication screen:

```typescript
// components/AuthenticationScreen.tsx
import { useWallet } from "@/context/WalletContext";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const AuthenticationScreen: React.FC = () => {
  const { connectWallet, isLoading, error } = useWallet();

  const handleCreateWallet = async () => {
    try {
      // This triggers the biometric prompt
      await connectWallet({
        redirectUrl: "lazorkit://wallet/connected",
      });

      // On success, user is authenticated
      // Navigate to wallet dashboard
      navigation.navigate("wallet");
    } catch (err) {
      // Show error message
      Alert.alert("Authentication Failed", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Lazorkit Wallet</Text>
      <Text style={styles.subtitle}>Secured by your fingerprint or face</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateWallet}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="fingerprint" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Create Wallet</Text>
          </>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};
```

#### Step 1.3: Handle Authentication Flow

Understand what happens during authentication:

```typescript
// When user taps "Create Wallet":

// 1. Device shows biometric prompt
//    - iOS: FaceID or TouchID prompt appears
//    - Android: Fingerprint or Face unlock prompt appears

// 2. User authenticates with biometrics
//    - System validates biometric data
//    - Biometric credential is stored in Secure Enclave

// 3. Lazorkit SDK creates smart wallet
//    - Calls Lazorkit Portal to create account
//    - Associates passkey with on-chain wallet address
//    - Wallet is now deployed on Solana

// 4. App receives wallet address
//    - useWallet.walletAddress = '11111...'
//    - useWallet.isConnected = true
//    - User can now send transactions
```

#### Step 1.4: Persist Session

Automatically save and restore wallet sessions:

```typescript
// WalletContext automatically persists:
// - Wallet address (in SecureStore)
// - Transaction history (in SecureStore)
// - Last activity timestamp

// On app restart:
useEffect(() => {
  restoreSession(); // Automatically called

  // Check if wallet is still connected
  if (isConnected) {
    navigation.navigate("wallet");
  } else {
    navigation.navigate("auth");
  }
}, [isConnected]);
```

#### Step 1.5: Verify Wallet Creation

Display wallet information to user:

```typescript
const { walletAddress, isConnected } = useWallet();

if (isConnected && walletAddress) {
  return (
    <View>
      <Text>✅ Wallet Created Successfully!</Text>
      <Text>Address: {truncateAddress(walletAddress)}</Text>
      <TouchableOpacity onPress={() => copyToClipboard(walletAddress)}>
        <Text>Copy Full Address</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### Step 1.6: Handle Errors

Common errors and solutions:

```typescript
const handleCreateWallet = async () => {
  try {
    await connectWallet();
  } catch (error) {
    if (error.message.includes("biometric")) {
      // User's device doesn't have biometrics
      Alert.alert("Setup Required", "Enable FaceID or TouchID in Settings");
    } else if (error.message.includes("cancelled")) {
      // User cancelled biometric prompt
      console.log("User cancelled authentication");
    } else if (error.message.includes("network")) {
      // Network error during wallet creation
      Alert.alert("Network Error", "Check your connection and try again");
    } else {
      // Unknown error
      Alert.alert("Error", error.message);
    }
  }
};
```

### Key Concepts

**Secure Enclave** (iOS)

- Hardware chip dedicated to security
- Stores cryptographic keys
- Never exports keys outside chip
- Requires biometric to access

**Strongbox** (Android)

- Similar to Secure Enclave
- Hardware-backed keystore
- Stores sensitive credentials
- Requires biometric to use

**Cross-Device Sync**

- iOS: Passkeys synced via iCloud Keychain
- Android: Passkeys synced via Google Password Manager
- Can restore wallet on new device with same account

---

## Tutorial 2: Gasless USDC Transfers

### What is Gasless?

"Gasless" means the Lazorkit Paymaster pays Solana network fees (SOL):

```
Traditional Transaction:
User A has: 100 USDC, 0 SOL
Send: 50 USDC to User B
Problem: ❌ Cannot send (needs ~0.00025 SOL for fees)

Gasless Transaction:
User A has: 100 USDC, 0 SOL
Send: 50 USDC to User B (Paymaster covers SOL)
Success: ✅ Transaction sent (User A has 50 USDC left)
```

### Implementation Steps

#### Step 2.1: Check Available Balance

Fetch user's USDC balance:

```typescript
// In GaslessTransferScreen.tsx
import { useWallet } from "@/context/WalletContext";

export const GaslessTransferScreen = () => {
  const { walletAddress } = useWallet();
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    fetchUSDCBalance();
  }, [walletAddress]);

  const fetchUSDCBalance = async () => {
    try {
      // Query blockchain for USDC balance
      const connection = new Connection(rpcUrl);
      const accounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { mint: new PublicKey(USDC_MINT_DEVNET) }
      );

      if (accounts.value.length > 0) {
        const amount =
          accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        setBalance(amount);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  return (
    <View>
      <Text>Available USDC: {formatNumber(balance)}</Text>
    </View>
  );
};
```

#### Step 2.2: Create Input Form

Build the transfer form:

```typescript
const [form, setForm] = useState({
  recipient: "",
  amount: "",
  token: "USDC",
});

const [errors, setErrors] = useState<{ [key: string]: string }>({});

const validateForm = (): boolean => {
  const newErrors: { [key: string]: string } = {};

  // Validate recipient
  if (!form.recipient.trim()) {
    newErrors.recipient = "Recipient address required";
  } else if (!isValidSolanaAddress(form.recipient)) {
    newErrors.recipient = "Invalid Solana address";
  }

  // Validate amount
  if (!form.amount.trim()) {
    newErrors.amount = "Amount required";
  } else if (parseFloat(form.amount) <= 0) {
    newErrors.amount = "Amount must be greater than 0";
  } else if (parseFloat(form.amount) > balance) {
    newErrors.amount = `Insufficient balance (${formatNumber(
      balance
    )} available)`;
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

return (
  <View>
    <TextInput
      placeholder="Recipient address"
      value={form.recipient}
      onChangeText={(text) => setForm((prev) => ({ ...prev, recipient: text }))}
    />
    {errors.recipient && <Text style={styles.error}>{errors.recipient}</Text>}

    <TextInput
      placeholder="Amount"
      value={form.amount}
      keyboardType="decimal-pad"
      onChangeText={(text) =>
        setForm((prev) => ({
          ...prev,
          amount: text.replace(/[^0-9.]/g, ""),
        }))
      }
    />
    {errors.amount && <Text style={styles.error}>{errors.amount}</Text>}

    <TouchableOpacity onPress={() => validateForm() && handleSend()}>
      <Text>Send USDC</Text>
    </TouchableOpacity>
  </View>
);
```

#### Step 2.3: Show Transaction Review

Display confirmation screen:

```typescript
const renderReview = () => (
  <View style={styles.reviewContainer}>
    <Text style={styles.reviewTitle}>Review Transfer</Text>

    <View style={styles.reviewItem}>
      <Text>From:</Text>
      <Text>{truncateAddress(walletAddress)}</Text>
    </View>

    <View style={styles.divider} />

    <View style={styles.reviewItem}>
      <Text>To:</Text>
      <Text>{truncateAddress(form.recipient)}</Text>
    </View>

    <View style={styles.divider} />

    <View style={styles.reviewItem}>
      <Text>Amount:</Text>
      <Text style={styles.amount}>{form.amount} USDC</Text>
    </View>

    {/* Show gasless info */}
    <View style={styles.gaslessCard}>
      <Ionicons name="flash" size={20} color="#F59E0B" />
      <Text style={styles.gaslessText}>
        Network fees will be sponsored by Lazorkit
      </Text>
    </View>

    <TouchableOpacity
      style={styles.confirmButton}
      onPress={handleConfirmTransfer}
    >
      <Text>Confirm & Send</Text>
    </TouchableOpacity>
  </View>
);
```

#### Step 2.4: Send Gasless Transaction

Execute the transfer:

```typescript
const { sendTransaction, isLoading } = useWallet();

const handleConfirmTransfer = async () => {
  try {
    setIsProcessing(true);

    // Send transaction through Lazorkit
    // This internally:
    // 1. Creates transaction instructions
    // 2. Simulates transaction on-chain
    // 3. Contacts Paymaster for fee sponsorship
    // 4. Signs with user's passkey
    // 5. Submits to Solana network
    const signature = await sendTransaction(
      form.recipient,
      parseFloat(form.amount),
      form.token,
      { redirectUrl: "lazorkit://transfer/complete" }
    );

    // Show success
    setTransferStep("success");
    setTxSignature(signature);
  } catch (error) {
    Alert.alert("Transfer Failed", error.message);
  } finally {
    setIsProcessing(false);
  }
};
```

**Behind the scenes:**

```typescript
// What sendTransaction does:

1; // Validate inputs
if (!isValidSolanaAddress(recipient)) throw Error("Invalid address");
if (amount > balance) throw Error("Insufficient balance");

2; // Create transfer instruction
const instruction = createTransferInstruction({
  source: walletTokenAccount,
  destination: recipientTokenAccount,
  owner: wallet.address,
  amount: (amount * 10) ^ 6, // Convert to base units
});

3; // Build transaction
const transaction = new Transaction().add(instruction);

4; // Contact Paymaster
const { paymaster, fee } = await validateWithPaymaster(
  transaction,
  wallet.address
);

5; // User signs with passkey (biometric prompt)
const signature = await wallet.sign(transaction);

6; // Submit to network
const txSignature = await connection.sendTransaction(signedTransaction);

7; // Return signature
return txSignature;
```

#### Step 2.5: Monitor Transaction Status

Track confirmation:

```typescript
const [txStatus, setTxStatus] = useState<"pending" | "confirmed" | "failed">(
  "pending"
);

useEffect(() => {
  if (!txSignature) return;

  const checkStatus = async () => {
    const connection = new Connection(rpcUrl);

    const status = await connection.getSignatureStatus(txSignature);

    if (status.value === null) {
      setTxStatus("pending");
    } else if (status.value.err) {
      setTxStatus("failed");
    } else {
      setTxStatus("confirmed");
    }
  };

  // Check every 2 seconds for up to 30 seconds
  const interval = setInterval(checkStatus, 2000);
  const timeout = setTimeout(() => clearInterval(interval), 30000);

  return () => {
    clearInterval(interval);
    clearTimeout(timeout);
  };
}, [txSignature]);

const renderStatus = () => {
  switch (txStatus) {
    case "pending":
      return <Text>⏳ Processing...</Text>;
    case "confirmed":
      return <Text>✅ Confirmed!</Text>;
    case "failed":
      return <Text>❌ Failed</Text>;
  }
};
```

#### Step 2.6: Error Handling & Retry

Handle failures gracefully:

```typescript
const sendWithRetry = async () => {
  let lastError: Error;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await sendTransaction(
        form.recipient,
        parseFloat(form.amount),
        form.token
      );
    } catch (error) {
      lastError = error as Error;

      if (attempt < 3) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

const handleConfirmWithRetry = async () => {
  try {
    const signature = await sendWithRetry();
    setTransferStep("success");
  } catch (error) {
    Alert.alert(
      "Transfer Failed",
      "Failed after 3 attempts. Check your connection and try again."
    );
  }
};
```

### Cost Breakdown

```
Example: Send 100 USDC on Solana

Traditional Method:
- User needs: 100 USDC + ~0.00025 SOL
- User pays: ~0.0001 SOL (~$0.01 at $100/SOL)
- Problem: Need to acquire SOL first

Gasless Method (Lazorkit):
- User needs: 100 USDC only
- User pays: 0 SOL (Paymaster covers)
- Paymaster fee: Covered by protocol
- User experience: Seamless, no friction
```

---

## Tutorial 3: Session Persistence Across Devices

### What is Session Persistence?

Ability to restore your wallet on a new device using the same account:

```
Device 1 (iPhone):
- Create wallet with passkey
- Store secret in Secure Enclave
- iCloud sync enabled ☁️

Device 2 (New iPhone):
- Sign in with same iCloud account
- Passkey automatically restored
- Can immediately use wallet ✅

Device 3 (Android):
- Sign in with same Google account
- Passkey automatically restored
- Can immediately use wallet ✅
```

### Implementation Steps

#### Step 3.1: Enable Secure Storage

Store wallet info securely:

```typescript
// WalletContext.tsx
import * as SecureStore from "expo-secure-store";

// Store wallet address
await SecureStore.setItemAsync("walletAddress", walletAddress);

// Store transaction history
const txData = JSON.stringify(transactions);
await SecureStore.setItemAsync("transactions", txData);

// Store session metadata
await SecureStore.setItemAsync("sessionCreated", Date.now().toString());
```

**Security:**

- Data encrypted at rest
- iOS: Stored in Keychain (synced to iCloud)
- Android: Stored in Keystore (Google sync optional)
- Biometric required to access

#### Step 3.2: Restore Session on App Launch

Automatically restore on startup:

```typescript
useEffect(() => {
  restoreSession();
}, []);

const restoreSession = async () => {
  try {
    // Check if wallet was previously connected
    const savedWallet = await SecureStore.getItemAsync("walletAddress");

    if (savedWallet) {
      setWalletAddress(savedWallet);
      setIsConnected(true);

      // Restore transaction history
      const txData = await SecureStore.getItemAsync("transactions");
      if (txData) {
        setTransactions(JSON.parse(txData));
      }
    }
  } catch (error) {
    console.error("Failed to restore session:", error);
  }
};
```

#### Step 3.3: Verify Passkey on New Device

When restoring on a new device:

```typescript
// On new device, user signs in with iCloud/Google
// System prompts: "Restore passkey from iCloud?"
// User confirms with biometric
// Passkey is now available on new device

// In app:
const handleRestoreWallet = async () => {
  try {
    // Trigger biometric to verify identity
    await connectWallet({
      redirectUrl: "lazorkit://wallet/restored",
    });

    // Passkey confirmed, wallet is ready
    setIsConnected(true);
  } catch (error) {
    Alert.alert("Restore Failed", error.message);
  }
};
```

#### Step 3.4: Handle Device Out-of-Sync

Sync wallet state across devices:

```typescript
// Problem: User creates transaction on Device 1
// but transaction history not synced to Device 2

// Solution: Fetch latest from blockchain
const syncTransactionHistory = async () => {
  const connection = new Connection(rpcUrl);

  // Get all transactions for wallet
  const signatures = await connection.getSignaturesForAddress(
    new PublicKey(walletAddress)
  );

  // Parse transactions
  const txs = await Promise.all(
    signatures.map((sig) => connection.getParsedTransaction(sig.signature))
  );

  // Update local cache
  setTransactions(
    txs.map((tx) => ({
      id: tx.transaction.signatures[0],
      signature: tx.transaction.signatures[0],
      // ... parse transaction details
    }))
  );
};

// Call on app launch
useEffect(() => {
  if (isConnected) {
    syncTransactionHistory();
  }
}, [isConnected]);
```

#### Step 3.5: Clear Session When Needed

Allow users to disconnect:

```typescript
const handleLogout = async () => {
  Alert.alert("Disconnect", "Are you sure?", [
    { text: "Cancel" },
    {
      text: "Disconnect",
      onPress: async () => {
        // Clear all secure storage
        await SecureStore.deleteItemAsync("walletAddress");
        await SecureStore.deleteItemAsync("transactions");

        // Clear in-memory state
        setWalletAddress(null);
        setTransactions([]);
        setIsConnected(false);

        // Navigate to auth screen
        navigation.reset({
          index: 0,
          routes: [{ name: "auth" }],
        });
      },
      style: "destructive",
    },
  ]);
};
```

#### Step 3.6: Sync Across App Updates

Handle app version changes:

```typescript
// app.json
{
  "expo": {
    "version": "1.0.0",
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD"
    }
  }
}

// When app updates:
// 1. Download new version
// 2. Reload app
// 3. restoreSession() is called
// 4. All data is still available
```

---

## Tutorial 4: Transaction History & Filtering

### Implementation Steps

#### Step 4.1: Fetch Transaction History

Retrieve recent transactions:

```typescript
const fetchTransactionHistory = async () => {
  try {
    const connection = new Connection(rpcUrl);

    // Get all transaction signatures
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(walletAddress),
      { limit: 10 }
    );

    // Parse transaction details
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getParsedTransaction(sig.signature);

        if (!tx) return null;

        // Extract relevant info
        return {
          id: sig.signature,
          signature: sig.signature,
          timestamp: (tx.blockTime || 0) * 1000,
          type: parseTransactionType(tx),
          amount: parseTransactionAmount(tx),
          recipient: parseRecipient(tx),
          status:
            sig.confirmationStatus === "finalized" ? "confirmed" : "pending",
        };
      })
    );

    setTransactions(transactions.filter(Boolean) as Transaction[]);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
  }
};
```

#### Step 4.2: Parse Transaction Type

Determine transaction type:

```typescript
const parseTransactionType = (tx: ParsedTransaction): TransactionType => {
  // Check for token transfer (USDC)
  if (hasUSDCTransfer(tx)) {
    return "send"; // or 'receive' based on direction
  }

  // Check for swap
  if (hasSwap(tx)) {
    return "swap";
  }

  // Check for billing
  if (hasBilling(tx)) {
    return "billing";
  }

  return "send"; // default
};

const hasUSDCTransfer = (tx: ParsedTransaction): boolean => {
  return tx.transaction.message.instructions.some((ix) => {
    if (!("parsed" in ix)) return false;
    return ix.parsed.type === "transfer" && ix.parsed.info.mint === USDC_MINT;
  });
};
```

#### Step 4.3: Filter Transactions

Add filtering options:

```typescript
type TransactionFilter = 'all' | 'sent' | 'received' | 'swaps' | 'billing';

const [filter, setFilter] = useState<TransactionFilter>('all');

const filteredTransactions = transactions.filter(tx => {
  if (filter === 'all') return true;
  if (filter === 'sent') return tx.type === 'send';
  if (filter === 'received') return tx.type === 'receive';
  if (filter === 'swaps') return tx.type === 'swap';
  if (filter === 'billing') return tx.type === 'billing';
  return true;
});

// Render filter buttons
<View style={styles.filterContainer}>
  <FilterButton
    label="All"
    active={filter === 'all'}
    onPress={() => setFilter('all')}
  />
  <FilterButton
    label="Sent"
    active={filter === 'sent'}
    onPress={() => setFilter('sent')}
  />
  <FilterButton
    label="Received"
    active={filter === 'received'}
    onPress={() => setFilter('received')}
  />
</View>

// Display filtered list
<FlatList
  data={filteredTransactions}
  renderItem={({ item }) => <TransactionItem transaction={item} />}
/>
```

#### Step 4.4: Search Transactions

Add search functionality:

```typescript
const [searchQuery, setSearchQuery] = useState('');

const searchedTransactions = filteredTransactions.filter(tx => {
  const query = searchQuery.toLowerCase();

  return (
    tx.recipient?.toLowerCase().includes(query) ||
    tx.signature.toLowerCase().includes(query) ||
    tx.token.toLowerCase().includes(query)
  );
});

<TextInput
  placeholder="Search transactions..."
  value={searchQuery}
  onChangeText={setSearchQuery}
  style={styles.searchInput}
/>

<FlatList
  data={searchedTransactions}
  renderItem={({ item }) => <TransactionItem transaction={item} />}
/>
```

#### Step 4.5: Sort Transactions

Add sorting options:

```typescript
type SortOrder = "newest" | "oldest" | "amount-high" | "amount-low";

const [sortBy, setSortBy] = useState<SortOrder>("newest");

const sortedTransactions = [...filteredTransactions].sort((a, b) => {
  switch (sortBy) {
    case "newest":
      return b.timestamp - a.timestamp;
    case "oldest":
      return a.timestamp - b.timestamp;
    case "amount-high":
      return b.amount - a.amount;
    case "amount-low":
      return a.amount - b.amount;
    default:
      return 0;
  }
});
```

#### Step 4.6: Display Transaction Details

Show detailed view:

```typescript
const TransactionDetail: React.FC<{ transaction: Transaction }> = ({
  transaction,
}) => {
  return (
    <View style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>
          {transaction.type === "send" ? "Sent" : "Received"}{" "}
          {transaction.token}
        </Text>
        <Text
          style={[
            styles.detailAmount,
            { color: transaction.type === "send" ? "#EF4444" : "#10B981" },
          ]}
        >
          {transaction.type === "send" ? "-" : "+"}
          {transaction.amount}
        </Text>
      </View>

      <View style={styles.detailInfo}>
        <DetailRow label="Date" value={formatDateTime(transaction.timestamp)} />
        <DetailRow label="Status" value={transaction.status} />
        <DetailRow label="Type" value={transaction.type} />
        {transaction.recipient && (
          <DetailRow
            label="Recipient"
            value={truncateAddress(transaction.recipient)}
            copyable
          />
        )}
        <DetailRow
          label="Signature"
          value={truncateAddress(transaction.signature)}
          copyable
        />
      </View>

      <TouchableOpacity
        style={styles.viewOnExplorerButton}
        onPress={() => {
          const url = getExplorerUrl(transaction.signature);
          Linking.openURL(url);
        }}
      >
        <Ionicons name="open-outline" size={20} color="#6366F1" />
        <Text style={styles.viewOnExplorerText}>View on Explorer</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## Advanced Topics

### Sponsoring Multiple Transactions

Support recurring billing:

```typescript
interface BillingConfig {
  recipient: PublicKey;
  amount: number;
  token: string;
  frequency: "daily" | "weekly" | "monthly";
  maxAmount: number; // Spending limit
}

const setupRecurringBilling = async (config: BillingConfig) => {
  // Create on-chain policy limiting spending
  const policy = {
    recipient: config.recipient,
    dailyLimit:
      config.frequency === "daily"
        ? config.maxAmount
        : config.frequency === "weekly"
        ? config.maxAmount / 7
        : config.maxAmount / 30,
    token: config.token,
  };

  // Store policy in smart wallet
  await updateSmartWalletPolicy(policy);
};
```

### Session Keys for Scoped Access

Allow limited permissions:

```typescript
// Create session key with specific permissions
const sessionKey = await createSessionKey({
  permissions: {
    maxAmount: 100, // Max 100 USDC per transaction
    allowedRecipients: ["recipient1Address", "recipient2Address"],
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  },
});

// Use session key for transactions (no biometric needed)
await sendTransactionWithSessionKey(
  sessionKey,
  "recipient1Address",
  50,
  "USDC"
);
```

### Webhook Notifications

Real-time transaction updates:

```typescript
// Set up webhook to receive transaction notifications
const setupWebhook = async (webhookUrl: string) => {
  // Register webhook with Lazorkit
  await axios.post("https://api.lazor.sh/webhooks", {
    url: webhookUrl,
    events: ["transaction.confirmed", "transaction.failed"],
  });
};

// Handle webhook request
app.post("/webhook", (req, res) => {
  const { event, transaction } = req.body;

  if (event === "transaction.confirmed") {
    console.log("Transaction confirmed:", transaction.signature);
    // Update UI, notify user, etc.
  }
});
```

---

## Summary

These tutorials cover:

1. ✅ Creating secure passkey wallets
2. ✅ Sending gasless USDC transactions
3. ✅ Persisting sessions across devices
4. ✅ Managing transaction history
5. ✅ Advanced features (billing, session keys)

For more information, visit:

- 📚 [Lazorkit Docs](https://docs.lazorkit.com/)
- 💬 [Telegram Community](https://t.me/lazorkit)
- 🐙 [GitHub](https://github.com/lazor-kit)

---

**Happy building! 🚀**
