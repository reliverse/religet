import { relinka } from "@reliverse/relinka";

import { defineCommand, runMain } from "@reliverse/rempts";

const CMDS = ["stable", "exp"];

const main = defineCommand({
  meta: {
    name: "blerrent",
    version: "0.1.0",
    description: "An example CLI that supports file-based subcommands.",
  },
  args: {
    dev: {
      type: "boolean",
      description: "Run CLI in dev mode",
    },
  },
  async run({ args }) {
    relinka(
      "info",
      "Use `rempts [command]` to run specific file-based commands.",
    );
    if (args.dev) {
      relinka("log", "Defined in the `src/cli/args` directory.");
    }
    relinka("info", "Avaliable commands:", CMDS.join(", "));
    if (args.dev) {
      relinka("log", "Example: bun dev e-setup --help");
    } else {
      relinka("log", "Example: rempts e-setup --help");
    }
  },
});

await runMain(main, {
  fileBasedCmds: { enable: true, cmdsRootPath: "src/cli/args" },
  alias: { d: "dev" },
  warnOnUnknown: false,
  negatedBoolean: true,
  strict: false,
});
