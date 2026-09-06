const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.platformMinimized = true;
config.resolver.platforms = ['ios', 'android', 'native', ...config.resolver.platforms];

module.exports = config;
