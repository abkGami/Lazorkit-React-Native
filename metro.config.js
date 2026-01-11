const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure polyfills are loaded first
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    buffer: require.resolve("buffer"),
    crypto: require.resolve("react-native-get-random-values"),
    stream: require.resolve("readable-stream"),
  },
};

module.exports = config;
