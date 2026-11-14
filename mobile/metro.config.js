// The app reuses MatchLab's pure business rules (schemas, 40/60 scoring, formations,
// questionnaire) straight from the web project: one source, no copy.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const shared = path.resolve(__dirname, "../src/lib/matchlab");
config.watchFolders = [...(config.watchFolders ?? []), shared];
// Shared files import "zod": resolve it from the app first, then from the web project.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../node_modules"),
];
module.exports = config;
