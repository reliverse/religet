#!/usr/bin/env bun
import { defineCommand, runMain, inputPrompt } from "@reliverse/rempts";
import path from "pathe";
import { mkdir } from "node:fs/promises";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import { download } from "~/libs/lite/lite-main"; // adjust path if published

const VERSION = "0.2.0";

const eta = (ms: number) =>
  !ms || !Number.isFinite(ms) ? "∞" : prettyMs(ms, { compact: true });

const promptIf = async <T>(
  batch: boolean,
  value: T | undefined,
  prompt: () => Promise<T>,
): Promise<T> => {
  if (value !== undefined) return value;
  if (batch) throw new Error("Missing arg in --batch mode");
  return prompt();
};

const main = defineCommand({
  meta: {
    name: "blerrent",
    version: VERSION,
    description: "tiny torrent CLI (no WebTorrent)",
  },
  args: {
    input: {
      type: "positional",
      description: ".torrent file or magnet (magnet not yet!)",
    },
    out: { type: "string", description: "Download dir (default ./downloads)" },
    quiet: { type: "boolean", default: false, alias: ["no-progress"] },
    batch: { type: "boolean", default: false },
  },
  async run({ args }) {
    const batch = args.batch;
    const src = await promptIf(batch, args.input, () =>
      inputPrompt({ title: "Torrent path", placeholder: "./ubuntu.torrent" }),
    );

    let outDir = await promptIf(batch, args.out, () =>
      inputPrompt({ title: "Download directory", placeholder: "./downloads" }),
    );
    if (!outDir) outDir = "./downloads";
    await mkdir(outDir, { recursive: true });

    const start = Date.now();
    const dl = download(src, { output: path.join(outDir, path.basename(src)) });

    dl.on("progress", (p) => {
      if (args.quiet) return;
      const speed = prettyBytes(p.bytesTotal - p.bytesLeft) + "/dl"; // rough instantaneous
      process.stdout.write(
        `\r${p.percent.toFixed(1)}%  pieces ${p.piecesDone}/${p.piecesTotal}` +
          `  left ${prettyBytes(p.bytesLeft)}  ETA ${eta(((Date.now() - start) / p.piecesDone) * (p.piecesTotal - p.piecesDone))}` +
          `  ${speed}       `,
      );
    });
    dl.on("done", () => {
      if (!args.quiet) process.stdout.write("\n");
      console.log("✅ finished");
      process.exit(0);
    });
    dl.on("error", (e) => {
      console.error("Error:", e);
      process.exit(1);
    });
  },
});
