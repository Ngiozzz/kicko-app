const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Standard Expo monorepo setup (https://docs.expo.dev/guides/monorepos/):
// Metro only watches/resolves within projectRoot by default, so it can't
// see @kicko/shared living as a sibling workspace package one level up.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;
// Belt-and-braces on top of the symlink support above — npm creates a real
// symlink for @kicko/shared in node_modules, but Metro's symlink-following
// was still failing to resolve it (Windows npm workspace symlinks can be
// junctions rather than true symlinks, which Metro's resolver doesn't
// always follow the same way). Mapping the path directly sidesteps that
// entirely.
config.resolver.extraNodeModules = {
  '@kicko/shared': path.resolve(workspaceRoot, 'shared'),
};

module.exports = config;
