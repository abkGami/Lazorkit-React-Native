# Lazorkit React Native Integration Example

A production-ready example demonstrating **Lazorkit SDK** integration for building passwordless, gasless Solana mobile applications.

## 🚀 What is This?

This is a complete, working example that shows how to build blockchain applications with:

- ✅ **Biometric authentication** (FaceID/TouchID) - no seed phrases
- ✅ **Gasless transactions** - pay with any token
- ✅ **Smart wallets** - programmable accounts with recovery
- ✅ **Beautiful UI** - production-grade components
- ✅ **Full documentation** - tutorials and guides

## 📚 Documentation

### Quick References

- **[QUICK_START.md](QUICK_START.md)** ⚡ - Get running in 5 minutes
- **[README_LAZORKIT.md](README_LAZORKIT.md)** 📖 - Complete project guide
- **[TUTORIALS.md](TUTORIALS.md)** 🎓 - Step-by-step tutorials
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** 🔧 - Technical integration details

### What to Read First

1. **New to Lazorkit?** → Start with [QUICK_START.md](QUICK_START.md)
2. **Want full documentation?** → Read [README_LAZORKIT.md](README_LAZORKIT.md)
3. **Learning by example?** → Follow [TUTORIALS.md](TUTORIALS.md)
4. **Deep technical dive?** → See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

## 🎯 Key Features Included

### 1. Passkey Authentication

```typescript
// One-tap wallet creation with biometrics
await connectWallet(); // FaceID/TouchID prompt
// That's it! Wallet is ready
```

### 2. Gasless USDC Transfer

```typescript
// Send USDC without holding SOL
await sendTransaction(
  "recipient-address",
  100,
  "USDC"
  // Fees automatically sponsored by Paymaster
);
```

### 3. Wallet Dashboard

- View balance and transaction history
- Copy wallet address
- Disconnect and logout
- Beautiful, modern UI

### 4. Session Persistence

- Wallet survives app restart
- Cross-device restoration via iCloud/Google
- Secure storage of credentials

## 📁 Project Structure

```
components/
  ├── AuthenticationScreen.tsx      # Passkey login flow
  ├── GaslessTransferScreen.tsx     # Send USDC gasless
  └── WalletDashboard.tsx           # Wallet overview

context/
  └── WalletContext.tsx             # Global state management

utils/
  ├── config.ts                     # Configuration
  ├── helpers.ts                    # Utility functions
  └── lazorkit.ts                   # SDK integration

app/
  ├── _layout.tsx                   # Root layout
  └── (tabs)/                       # Navigation screens
```

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Start development server
npm start

# 4. Open in Expo Go (scan QR)
#    or press 'i' for iOS / 'a' for Android
```

## 💡 Example Code

### Connect Wallet

```typescript
import { useWallet } from "@/context/WalletContext";

export function App() {
  const { connectWallet, walletAddress } = useWallet();

  return <Button title="Connect Wallet" onPress={connectWallet} />;
}
```

### Send USDC

```typescript
const { sendTransaction } = useWallet();

const handleSend = async () => {
  const signature = await sendTransaction(
    "recipient-address",
    100, // 100 USDC
    "USDC"
  );
  console.log("Sent:", signature);
};
```

### View Transactions

```typescript
const { transactions } = useWallet();

transactions.forEach((tx) => {
  console.log(`${tx.type}: ${tx.amount} ${tx.token}`);
});
```

## 🔧 Configuration

### Environment Variables

```env
EXPO_PUBLIC_NETWORK=devnet
EXPO_PUBLIC_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_PORTAL_URL=https://portal.lazor.sh
EXPO_PUBLIC_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com
```

### Changing Networks

```typescript
// Development (Devnet)
<WalletProvider network="devnet">

// Production (MainNet)
<WalletProvider network="mainnet">
```

## 📚 Tutorials Included

1. **Passkey Wallet Creation** - Create a wallet with biometrics
2. **Gasless USDC Transfer** - Send tokens without SOL fees
3. **Session Persistence** - Restore wallet across devices
4. **Transaction History** - Track and filter transactions

See [TUTORIALS.md](TUTORIALS.md) for detailed step-by-step guides.

## 🏗️ Architecture

```
Mobile App (React Native)
  ↓
WalletContext (State Management)
  ↓
Lazorkit SDK (@lazorkit/wallet-mobile-adapter)
  ↓
Solana Blockchain (RPC)
Lazorkit Portal (Key Management)
Paymaster Service (Fee Sponsorship)
```

## ✅ What's Working

- ✅ Wallet connection with biometric authentication
- ✅ Gasless transaction sending (mock implementation)
- ✅ Transaction history management
- ✅ Session persistence across restarts
- ✅ Beautiful, production-grade UI
- ✅ Complete error handling
- ✅ Full TypeScript support
- ✅ Comprehensive documentation

## 🚀 Next Steps

### For Learning

1. Read [QUICK_START.md](QUICK_START.md)
2. Follow tutorials in [TUTORIALS.md](TUTORIALS.md)
3. Explore component code with comments
4. Review [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

### For Development

1. Clone this repo
2. Install dependencies: `npm install`
3. Create `.env` from `.env.example`
4. Start dev server: `npm start`
5. Test on device or simulator
6. Integrate into your own app

### For Production

1. Audit smart contracts
2. Switch to MainNet
3. Set up Paymaster sponsorship
4. Deploy to app stores
5. Monitor and maintain

## 📖 Resources

- **Lazorkit Docs:** https://docs.lazorkit.com/
- **Lazorkit GitHub:** https://github.com/lazor-kit/lazor-kit
- **Solana Docs:** https://docs.solana.com/
- **Expo Docs:** https://docs.expo.dev/
- **Telegram Community:** https://t.me/lazorkit

## 🎓 Learning Path

### Beginner

1. [QUICK_START.md](QUICK_START.md) - Get it running
2. Try connecting wallet
3. Send a test transaction

### Intermediate

1. [TUTORIALS.md](TUTORIALS.md) - Learn patterns
2. Customize UI components
3. Add features to components

### Advanced

1. [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Deep dive
2. [README_LAZORKIT.md](README_LAZORKIT.md) - Full reference
3. Review source code comments
4. Understand Lazorkit architecture

## 🤔 Common Questions

**Q: How do I change networks?**
A: Set `network="mainnet"` in WalletProvider

**Q: Can I customize the UI?**
A: Yes! All components are fully customizable React Native

**Q: Does this work without MetaMask?**
A: Yes! Completely self-contained, no external apps needed

**Q: How do I test transactions?**
A: Use Devnet with free test tokens from faucets

**Q: Can I use this in production?**
A: Yes, after switching to MainNet and security audits

## 🐛 Troubleshooting

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md#troubleshooting) for detailed troubleshooting.

### Common Issues

- **Biometric not working?** → Enable in device settings
- **Network errors?** → Check internet connection
- **Wallet not connecting?** → Check RPC endpoint
- **Transactions failing?** → Validate recipient address

## 💬 Get Help

- **Documentation:** [README_LAZORKIT.md](README_LAZORKIT.md)
- **Tutorials:** [TUTORIALS.md](TUTORIALS.md)
- **Telegram:** https://t.me/lazorkit
- **GitHub Issues:** https://github.com/lazor-kit/lazor-kit/issues

## 📝 License

MIT License - see LICENSE file

---

## 🌟 Features at a Glance

| Feature       | Status | Notes                          |
| ------------- | ------ | ------------------------------ |
| Passkey Auth  | ✅     | FaceID/TouchID support         |
| Gasless TX    | ✅     | Via Paymaster sponsorship      |
| Smart Wallet  | ✅     | PDA-based accounts             |
| TX History    | ✅     | Persistent storage             |
| Session Mgmt  | ✅     | Auto-restore on app launch     |
| Recovery      | ✅     | Cross-device via iCloud/Google |
| Mobile UI     | ✅     | Production-grade design        |
| Documentation | ✅     | Comprehensive guides           |

---

**Ready to build? Start with [QUICK_START.md](QUICK_START.md)! 🚀**

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
