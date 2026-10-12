const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Metro only sees files under this folder, so nothing from the web apps,
 * packages/* or the monorepo root node_modules can end up in the bundle.
 * Don't add `watchFolders` pointing outside this app; `npm run check:isolation`
 * fails if a bundle ever contains outside files.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
