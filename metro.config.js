const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Supabase functions-js types resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Resolve .js files as modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
