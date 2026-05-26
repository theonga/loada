const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo so Metro sees packages/* and apps/*
config.watchFolders = [monorepoRoot];

// Resolve packages from mobile-local first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// The admin app uses React 18 which npm hoists to the root node_modules.
// The mobile app uses React 19 at apps/mobile/node_modules/react.
// Metro finds both and uses the wrong one for packages at the root (e.g.
// @react-navigation/core), causing the "invalid hook call" error at startup.
// This custom resolver intercepts every 'react' import from any file and
// pins it to the single mobile-local copy — the one react-native was
// installed alongside.
const pinnedModules = ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'];
const resolvedPins = Object.fromEntries(
  pinnedModules.map((m) => [m, require.resolve(m, { paths: [projectRoot] })])
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pinned = resolvedPins[moduleName];
  if (pinned) {
    return { filePath: pinned, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
