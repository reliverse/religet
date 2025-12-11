import { defineCommand, runMain, inputPrompt } from "@reliverse/rempts";
import { ensureDir, pathExists, remove } from "fs-extra";
import path from "pathe";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import WebTorrent, { type Torrent } from "webtorrent";

// constants
const VERSION = "0.1.0";

// utils
const eta = (ms: number) =>
  !ms || !Number.isFinite(ms) ? "∞" : prettyMs(ms, { compact: true });
const promptIf = async <T>(
  batch: boolean,
  value: T | undefined,
  prompt: () => Promise<T>,
): Promise<T> => {
  if (value !== undefined) return value;
  if (batch) throw new Error("Missing required argument in --batch mode");
  return prompt();
};

// cli
const main = defineCommand({
  meta: {
    name: "blerrent",
    version: VERSION,
    description: "Download a torrent (file or magnet link)",
  },
  args: {
    input: {
      type: "positional",
      required: false,
      description: ".torrent file or magnet URI",
    },
    out: {
      type: "string",
      required: false,
      description: "Output dir (default ./downloads)",
    },
    seed: {
      type: "boolean",
      default: false,
      description: "Keep seeding after download",
    },
    seedTime: {
      type: "number",
      description: "When --seed, stop after N minutes",
    },
    quiet: {
      type: "boolean",
      default: false,
      alias: ["no-progress"],
      description: "Suppress progress output",
    },
    interval: {
      type: "number",
      default: 1000,
      description: "Progress refresh interval (ms)",
    },
    batch: {
      type: "boolean",
      default: false,
      description: "Disable interactive prompts (CI)",
    },
  },
  async run({ args }) {
    // inputs
    const batch = args.batch;
    const src = await promptIf(batch, args.input, () =>
      inputPrompt({
        title: "Enter .torrent path or magnet link",
        placeholder: "./ubuntu.torrent",
      }),
    );
    let outDir = await promptIf(batch, args.out, () =>
      inputPrompt({ title: "Download directory", placeholder: "./downloads" }),
    );
    if (!outDir) outDir = "./downloads";
    await ensureDir(outDir);
    if (!src.startsWith("magnet:") && !(await pathExists(src))) {
      throw new Error(`Torrent file not found: ${src}`);
    }

    // webtorrent
    const client = new WebTorrent();
    const torrent: Torrent = await new Promise((res, rej) =>
      client.add(src, { path: outDir }, res).on("error", rej),
    );
    torrent.on("error", (e) => {
      console.error("Torrent error:", e instanceof Error ? e.message : e);
      cleanup(1);
    });

    // progress
    let ticker: NodeJS.Timeout | undefined;
    if (!args.quiet) {
      ticker = setInterval(
        () => {
          const pct = (torrent.progress * 100).toFixed(1);
          const speed = `${prettyBytes(client.downloadSpeed)}/s`;
          const rem = eta(torrent.timeRemaining);
          process.stdout.write(
            `\r${pct}% · ↓ ${speed} · peers ${torrent.numPeers} · ETA ${rem}     `,
          );
        },
        Math.max(args.interval, 250),
      );
    }

    // finish
    await new Promise<void>((done) => torrent.once("done", done));
    if (ticker) {
      clearInterval(ticker);
      process.stdout.write("\r");
    }
    console.log(
      `✔ Finished: ${torrent.files.length} files, ${prettyBytes(
        torrent.length,
      )} saved to ${path.resolve(outDir)}`,
    );

    // seed or exit
    if (args.seed) {
      const msg =
        args.seedTime && args.seedTime > 0
          ? `Seeding for ${args.seedTime} min...`
          : "Seeding... Press Ctrl+C to stop.";
      console.log(msg);
      if (args.seedTime && args.seedTime > 0) {
        setTimeout(() => cleanup(0), args.seedTime * 60 * 1000);
      }
    } else {
      cleanup(0);
    }

    // ctrl-c
    process.on("SIGINT", () => {
      console.log("\nSIGINT received. Cleaning up...");
      cleanup(130);
    });
    function cleanup(code = 0) {
      client.destroy(() => {
        void (async () => {
          if (!args.seed && torrent.done) {
            for (const f of torrent.files) {
              if (f.path.endsWith(".part") && (await pathExists(f.path))) {
                await remove(f.path);
              }
            }
          }
          process.exit(code);
        })();
      });
    }
  },
});

await runMain(main);
