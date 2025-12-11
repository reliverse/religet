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
  libsActMode: "libs-only",
  libsDirDist: "dist-libs",
  libsDirSrc: "src/libs",
  libsList: {
    "@reliverse/reche": {
      libDeclarations: true,
      libDescription:
        "@reliverse/reche is a lightweight, universal caching library for Node, browsers, and beyond. Inspired by the simplicity of in-memory caching with optional TTL, Reche makes it easy to manage, store, and retrieve cached data no matter the runtime.",
      libDirName: "core",
      libMainFile: "core/core-main.ts",
      libPkgKeepDeps: true,
      libTranspileMinify: true,
    },
    "@reliverse/reche-web": {
      libDeclarations: true,
      libDescription:
        "@reliverse/reche-web is a lightweight, universal caching library for browsers. Inspired by the simplicity of in-memory caching with optional TTL, Reche makes it easy to manage, store, and retrieve cached data.",
      libDirName: "web",
      libMainFile: "web/web-main.ts",
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
