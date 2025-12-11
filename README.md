# 🧬 @reliverse/religet

> **Zero-dependency project + template downloader. Based on [`giget`](https://github.com/unjs/giget), with extra vibes and developer-first polish.**

[📦 NPM](https://npmjs.com/package/@reliverse/religet) • [✨ GitHub](https://github.com/reliverse/religet) • [💬 Discord](https://discord.gg/Pb8uKbwpsJ)

## 💡 What is Religet?

**@reliverse/religet** is your one-stop drop-in CLI and library for pulling down project starters, templates, and repos — from GitHub, GitLab, Bitbucket, Sourcehut, or custom template registries.

Think of it like `degit`, `giget`, or `npx create-*` — but:

- 💥 No git required
- 🧠 Smart caching + offline mode
- 🔐 Auth support for private repos
- 🛠️ Custom registries and providers
- 💫 Built for starter kits, generators, internal tooling
- 📦 Perfect for tool authors who ship code templates

> **⚠️ Heads up!**  
> Some of the things mentioned in this doc aren't implemented *yet* — they're part of the vision for `v1.0.0`.
> Got thoughts? Ideas? Complaints? Drop your feedback in [Discord](https://discord.gg/Pb8uKbwpsJ) or use [GitHub Issues](https://github.com/reliverse/cli/issues).
> Your feedback means the world and helps shape where this project goes next. Thank you!

## 🚀 Install

```bash
pnpm add -D @reliverse/religet
```

or use directly via CLI:

```bash
npx @reliverse/religet gh:reliverse/cli-starter
```

## 🔧 Usage (CLI)

```bash
npx religet <template> [target-dir] [...options]
```

### Examples

```bash
# Clone a GitHub repo via shortcut
religet gh:reliverse/resejs-starter

# Clone to a custom folder
religet gh:user/template my-new-project

# Clone subpath from main branch
religet gh:user/template/starters/web

# Clone from a tarball
religet https://api.github.com/repos/unjs/template/tarball/main

# Use a custom registry
religet mylib --registry=https://registry.example.com
```

### CLI Flags

| Flag             | Description                                             |
|------------------|---------------------------------------------------------|
| `--force`         | Allow writing into existing folder                     |
| `--offline`       | Skip downloading, use local cache                      |
| `--prefer-offline`| Try cache first, fallback to download                  |
| `--force-clean`   | ⚠️ Delete folder before cloning                        |
| `--install`       | Auto-install deps (uses [`nypm`](https://github.com/unjs/nypm)) |
| `--cwd`           | Set working dir                                        |
| `--auth`          | Auth token for private repos (or use `GIGET_AUTH`)     |
| `--registry`      | Custom registry URL                                    |

## 🧠 Usage (Library)

```ts
import { downloadTemplate } from "@reliverse/religet";

const { dir, source } = await downloadTemplate("gh:reliverse/cli-starter", {
  dir: "./my-app",
  force: true,
  install: true,
});
```

### Options

- `dir`: Destination path
- `force`: Overwrite existing files
- `offline`, `preferOffline`
- `install`: Run dependency installation post-download
- `auth`: Access token (env `GIGET_AUTH` also supported)
- `provider`: Custom template providers
- `registry`: Template registry (e.g. GitHub JSON-based or custom)

## 📦 Template Sources

Religet supports a wide range of input formats:

| Format               | Example                                              |
|----------------------|------------------------------------------------------|
| GitHub repo          | `gh:user/repo`                                       |
| GitLab               | `gitlab:user/repo`                                   |
| Bitbucket            | `bitbucket:user/repo`                                |
| Sourcehut            | `sourcehut:user/repo`                                |
| HTTP tarball         | `https://github.com/user/repo/tarball/main`         |
| Template registry    | `your-template-name` + `--registry=...`              |

## 🔌 Advanced: Custom Providers

```ts
import type { TemplateProvider } from "@reliverse/religet";

const rainbow: TemplateProvider = async (input, { auth }) => {
  return {
    name: "rainbow",
    url: `https://rainbow.example/${input}`,
    tar: `https://rainbow.example/tarballs/${input}.tar.gz`,
    headers: { authorization: auth },
  };
};

await downloadTemplate("rainbow:example", {
  providers: { rainbow },
});
```

## 🧱 Use Cases

- 📦 Starter kits and boilerplates
- 🧙 `create-*` style CLIs
- 🛠️ Code generators for plugins, templates, engines
- 🌌 Internal developer platforms & dev portals
- 🤖 AI-assisted project bootstrapping

## 🔐 Private Repo Access

```bash
GIGET_AUTH=ghp_xxx religet gh:user/private-template
```

Works with CLI and programmatic APIs. Auth is sent via `Authorization: Bearer <token>`.

## 🔭 Related Projects

- [`giget`](https://github.com/unjs/giget) — the incredible base powering Religet
- [`degit`](https://github.com/Rich-Harris/degit) — the OG that started it all
- [`create-t3-app`](https://create.t3.gg) — template-first app generator
- [`unjs/nypm`](https://github.com/unjs/nypm) — dependency installer used internally

## 💬 Community & Feedback

- [💬 Join the Discord](https://discord.gg/Pb8uKbwpsJ)
- [📣 Follow @blefnk](https://twitter.com/blefnk)
- [✨ Contribute on GitHub](https://github.com/reliverse/religet)

## 📄 License

MIT © [blefnk (Nazar Kornienko)](https://github.com/blefnk)  
Part of the [Reliverse](https://github.com/reliverse) ecosystem.
