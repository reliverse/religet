import { defineConfig } from "@reliverse/relidler-cfg";

/**
 * Reliverse Bundler Configuration
 * Hover over a field to see more details
 * @see https://github.com/reliverse/relidler
 */
export default defineConfig({
  // Bump configuration
  bumpDisable: true,
  bumpFilter: ["package.json", "reliverse.ts"],
  bumpMode: "autoPatch",

  // Common configuration
  commonPubPause: true,
  commonPubRegistry: "npm-jsr",
  commonVerbose: false,

  // Core configuration
  coreDeclarations: false,
  coreEntryFile: "main.ts",
  coreEntrySrcDir: "src",
  coreIsCLI: true,

  // JSR-only config
  distJsrAllowDirty: true,
  distJsrBuilder: "jsr",
  distJsrCopyRootFiles: ["README.md", "LICENSE"],
  distJsrDirName: "dist-jsr",
  distJsrDryRun: false,
  distJsrGenTsconfig: false,
  distJsrOutFilesExt: "ts",
  distJsrSlowTypes: true,

  // NPM-only config
  distNpmBuilder: "mkdist",
  distNpmCopyRootFiles: ["README.md", "LICENSE"],
  distNpmDirName: "dist-npm",
  distNpmOutFilesExt: "js",

  // Libraries Relidler Plugin
  // Publish specific dirs as separate packages
  // This feature is experimental at the moment
  // Please commit your changes before using it
  libsActMode: "main-project-only", // TODO: change to "main-and-libs"
  libsDirDist: "dist-libs",
  libsDirSrc: "src-main/libs",
  libsList: {
    "@reliverse/blerrent": {
      libDeclarations: true,
      libDescription:
        "@reliverse/blerrent (CLI + 🔜 library + 🔜 desktop) is a high-performance BitTorrent client built for today's tools — and tomorrow's ideas. The CLI and desktop app are designed for users who want power without the bloat. The TypeScript-first library is crafted for developers who care about precision, speed, and clean, frictionless DX.",
      libDirName: "core",
      libMainFile: "core/core-main.ts",
      libPkgKeepDeps: true,
      libTranspileMinify: true,
    },
  },

  // Logger setup
  logsFileName: "relinka.log",
  logsFreshFile: true,

  // Dependency filtering
  rmDepsMode: "patterns-and-devdeps",
  rmDepsPatterns: [
    "@types",
    "biome",
    "eslint",
    "knip",
    "prettier",
    "@reliverse/cli-cfg",
  ],

  // Build setup
  transpileEsbuild: "es2023",
  transpileFormat: "esm",
  transpileMinify: true,
  transpilePublicPath: "/",
  transpileSourcemap: "none",
  transpileSplitting: false,
  transpileStub: false,
  transpileTarget: "node",
  transpileWatch: false,
});
