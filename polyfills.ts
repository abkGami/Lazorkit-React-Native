/**
 * Polyfills for React Native
 *
 * CRITICAL: This file must be imported BEFORE any other code
 * to ensure Buffer, crypto, and URL are available globally
 *
 * Required for Lazorkit SDK and Solana libraries
 */

// Crypto polyfill - must be first
import "react-native-get-random-values";

// URL polyfill - required for Lazorkit SDK
import "react-native-url-polyfill/auto";

// Buffer polyfill - using full buffer package
import { Buffer } from "buffer";

// Set global Buffer - CRITICAL for Solana/Anchor libraries
global.Buffer = global.Buffer || Buffer;

// Ensure Buffer has all required methods
if ((global as any).Buffer && !(global as any).Buffer.prototype.readUIntLE) {
  console.error("[Polyfills] WARNING: Buffer is missing readUIntLE method!");
} else {
  console.log("[Polyfills] ✓ Buffer.readUIntLE is available");
}

// Additional Node.js globals that might be needed
if (typeof (global as any).process === "undefined") {
  (global as any).process = {
    env: {},
    version: "v16.0.0",
    nextTick: (fn: Function, ...args: any[]) =>
      setTimeout(() => fn(...args), 0),
  };
}

// TextEncoder/TextDecoder polyfills
if (typeof (global as any).TextEncoder === "undefined") {
  const textEncoding = require("text-encoding");
  (global as any).TextEncoder = textEncoding.TextEncoder;
  (global as any).TextDecoder = textEncoding.TextDecoder;
}

console.log("[Polyfills] ✓ All polyfills loaded successfully");
