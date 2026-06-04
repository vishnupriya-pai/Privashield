const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];

config.resolver.blockList = [
  /\.local\/.*/,
];

module.exports = config;
