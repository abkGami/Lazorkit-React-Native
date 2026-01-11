import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { Redirect } from "expo-router";

/**
 * Catch-all route for unmatched deep links
 *
 * When the Lazorkit portal redirects back to the app with a deep link
 * like lazorkit://wallet/connected, this catches it and redirects to index.
 * The index page will then check isConnected and show the appropriate screen.
 */
export default function NotFoundScreen() {
  const { isConnected } = useWallet();

  // Always redirect to index - the index will handle auth state
  return <Redirect href="/" />;
}
