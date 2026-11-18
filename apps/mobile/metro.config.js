const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Drizzle's expo migrator imports the generated .sql migration files.
config.resolver.sourceExts.push('sql');

module.exports = config;
