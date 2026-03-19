const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Exclude test files and Maestro flows from the bundle
config.resolver.blockList = [
  /\/__tests__\/.*/,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /\.maestro\/.*/,
  /jest\.config\.js/,
]

module.exports = config
