import bencode from "bencode";
import fs from "fs-extra";
import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import { promises as fsp } from "node:fs";
import https from "node:https";
import net from "node:net";

export type DownloadOptions = {
  output?: string; // file path (defaults to torrent name)
  maxPeers?: number; // default 20
  pipelining?: number; // outstanding requests per peer (default 5)
};

export type Progress = {
  piecesDone: number;
  piecesTotal: number;
  bytesTotal: number;
  bytesLeft: number;
  percent: number; // 0-100
};

type Meta = {
  infoHash: Buffer;
  pieceLen: number;
  pieces: Buffer;
  length: number;
  announce: string;
  name: string;
};

const sha1 = (b: Buffer) => crypto.createHash("sha1").update(b).digest();
const PEER_ID = Buffer.from(`-RT03-${crypto.randomBytes(12).toString("hex")}`);

const parsePeers = (buf: Buffer) => {
  const out: { ip: string; port: number }[] = [];
  for (let i = 0; i < buf.length; i += 6)
    out.push({
      ip: buf.subarray(i, i + 4).join("."),
      port: buf.readUInt16BE(i + 4),
    });
  return out;
};

/* ---------- meta ---------- */
const parseTorrent = (file: Buffer): Meta => {
  const m = bencode.decode(file);
  const infoBuf = bencode.encode(m.info);
  return {
    infoHash: sha1(infoBuf),
    pieceLen: m.info["piece length"],
    pieces: Buffer.from(m.info.pieces, "binary"),
    length:
      m.info.length ||
      m.info.files.reduce(
        (n: number, f: { length: number }) => n + f.length,
        0,
      ),
    announce: m.announce.toString(),
    name: m.info.name.toString(),
  };
};

/* ---------- piece manager ---------- */
const createPieceMgr = (meta: Meta) => {
  const total = meta.pieces.length / 20;
  const have = Array<boolean>(total).fill(false);
  const avail = new Uint16Array(total);
  const markSeen = (i: number) => i < total && avail[i]++;
  const next = () => {
    let sel = -1;
    let best = 1e9;
    for (let i = 0; i < total; ++i) {
      if (have[i]) continue;
      const a = avail[i] || 1e9;
      if (a < best) {
        best = a;
        sel = i;
      }
    }
    return sel;
  };
  return { total, have, avail, markSeen, next };
};

/* ---------- tracker ---------- */
const fetchPeers = (meta: Meta) =>
  new Promise<{ ip: string; port: number }[]>((res, rej) => {
    const url = new URL(meta.announce);
    url.searchParams.set("info_hash", meta.infoHash.toString("binary"));
    url.searchParams.set("peer_id", PEER_ID.toString("binary"));
    url.searchParams.set("left", String(meta.length));
    url.searchParams.set("compact", "1");
    https
      .get(url, (r) => {
        const chunks: Buffer[] = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => {
          try {
            res(
              parsePeers(bencode.decode(Buffer.concat(chunks)).peers as Buffer),
            );
          } catch (e) {
            rej(e as Error);
          }
        });
      })
      .on("error", rej);
  });

/* ---------- peer ------------------------------------------------------- */
function spawnPeer(
  peer: { ip: string; port: number },
  meta: Meta,
  pm: ReturnType<typeof createPieceMgr>,
  fd: fs.promises.FileHandle,
  opts: Required<Pick<DownloadOptions, "pipelining">>,
  progress: { donePieces: number },
  emit: (ev: "progress", p: Progress) => void,
) {
  const sock = net
    .createConnection(peer.port, peer.ip)
    .on("error", () => sock.destroy());
  let buf = Buffer.alloc(0);
  let choked = true;
  let handshaked = false;
  let outstanding = 0;

  const send = (b: Buffer) => sock.writable && sock.write(b);

  /* handshake */
  sock.write(
    Buffer.concat([
      Buffer.from([19]),
      Buffer.from("BitTorrent protocol"),
      Buffer.alloc(8),
      meta.infoHash,
      PEER_ID,
    ]),
  );

  const request = (idx: number) => {
    const req = Buffer.alloc(17);
    req.writeUInt32BE(13, 0);
    req[4] = 6; // request id
    req.writeUInt32BE(idx, 5);
    req.writeUInt32BE(0, 9);
    req.writeUInt32BE(meta.pieceLen, 13);
    send(req);
    outstanding++;
    pm.have[idx] = true; // reserve
  };

  const verify = async (idx: number) => {
    const len =
      idx === pm.total - 1 ? meta.length - idx * meta.pieceLen : meta.pieceLen;
    const buf = Buffer.alloc(len);
    await fd.read(buf, 0, len, idx * meta.pieceLen);
    if (sha1(buf).equals(meta.pieces.subarray(idx * 20, idx * 20 + 20))) {
      progress.donePieces++;
      emit("progress", {
        piecesDone: progress.donePieces,
        piecesTotal: pm.total,
        bytesTotal: meta.length,
        bytesLeft: meta.length - progress.donePieces * meta.pieceLen,
        percent: (100 * progress.donePieces) / pm.total,
      });
    } else pm.have[idx] = false; // re-queue
  };

  const pump = () => {
    if (choked) return;
    while (outstanding < opts.pipelining) {
      const idx = pm.next();
      if (idx === -1) return;
      request(idx);
    }
  };

  sock.on("data", (chunk) => {
    void (async () => {
      buf = Buffer.concat([buf, chunk]);
      /* once per connection: swallow handshake */
      if (!handshaked && buf.length >= 68) {
        buf = buf.subarray(68);
        handshaked = true;
        send(Buffer.from([0, 0, 0, 1, 2])); // interested
      }
      while (buf.length >= 4) {
        const len = buf.readUInt32BE(0);
        if (buf.length < 4 + len) return;
        if (len === 0) {
          buf = buf.subarray(4);
          continue;
        } // keep-alive
        const id = buf[4];
        const payload = buf.subarray(5, 4 + len);
        buf = buf.subarray(4 + len);

        switch (id) {
          case 0:
            choked = true;
            break;
          case 1:
            choked = false;
            pump();
            break;
          case 4:
            pm.markSeen(payload.readUInt32BE(0));
            break;
          case 5:
            payload.forEach((byte, i) => {
              for (let b = 0; b < 8; b++)
                if (byte & (1 << (7 - b))) pm.markSeen(i * 8 + b);
            });
            pump();
            break;
          case 7: {
            const idx = payload.readUInt32BE(0);
            const begin = payload.readUInt32BE(4);
            const block = payload.subarray(8);
            await fd.write(block, 0, block.length, idx * meta.pieceLen + begin);
            if (begin + block.length >= meta.pieceLen) await verify(idx);
            outstanding--;
            pump();
            break;
          }
        }
      }
    })();
  });
}

/* ---------- public API -------------------------------------------------- */
export function download(
  torrentPathOrBuffer: string | Buffer,
  opts: DownloadOptions = {},
) {
  const emitter = new EventEmitter();
  (async () => {
    const buf =
      typeof torrentPathOrBuffer === "string"
        ? await fs.readFile(torrentPathOrBuffer)
        : torrentPathOrBuffer;
    const meta = parseTorrent(buf);
    const pm = createPieceMgr(meta);
    const fd = await fsp.open(opts.output ?? meta.name, "w");
    await fd.truncate(meta.length);

    const peers = (await fetchPeers(meta)).slice(0, opts.maxPeers ?? 20);
    const progState = { donePieces: 0 };

    for (const p of peers) {
      spawnPeer(
        p,
        meta,
        pm,
        fd,
        { pipelining: opts.pipelining ?? 5 },
        progState,
        emitter.emit.bind(emitter),
      );
    }

    emitter.on("progress", (p: Progress) => {
      if (p.percent >= 100) {
        emitter.emit("done");
        void fd.close();
      }
    });
  })().catch((e) => emitter.emit("error", e));

  return emitter;
}
