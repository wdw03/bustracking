const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add woff2 to asset extensions so Metro can resolve the custom font
config.resolver.assetExts.push('woff2');

module.exports = withNativeWind(config, { input: './src/global.css' });
