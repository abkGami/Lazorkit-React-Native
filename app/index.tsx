import { AuthenticationScreen } from "@/components/AuthenticationScreen";
import { WalletDashboard } from "@/components/WalletDashboard";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import React from "react";

export default function Index() {
  const { isConnected } = useWallet();

  return isConnected ? <WalletDashboard /> : <AuthenticationScreen />;
}
