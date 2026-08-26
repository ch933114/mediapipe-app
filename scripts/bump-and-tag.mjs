#!/usr/bin/env node
/**
 * Omniguider bump+tag（依 omniguider.config.json 的 tagStrategy）
 *
 * - test：v0.0.y   （patch+1）
 * - uat：v0.x.0    （minor+1，patch 固定 0；可選分支）
 * - main：vX.0.0   （major+1，minor/patch 固定 0；第一次為 v1.0.0）
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function run(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  }).trim();
}

function log(msg) {
  console.log(`[bump-and-tag] ${msg}`);
}
function warn(msg) {
  console.warn(`[bump-and-tag] ${msg}`);
}
function err(msg) {
  console.error(`[bump-and-tag] ${msg}`);
}

function parseMode() {
  const idx = process.argv.indexOf("--mode");
  if (idx === -1 || !process.argv[idx + 1]) {
    err("必須指定 --mode 參數，例如 --mode stage / prod / uat");
    process.exit(1);
  }
  const mode = process.argv[idx + 1];
  if (!["stage", "prod", "uat"].includes(mode)) {
    err(`--mode 必須為 stage / prod / uat，目前為 "${mode}"`);
    process.exit(1);
  }
  return mode;
}

function parseVersion(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v ?? "");
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

function latestTag(tags, predicate) {
  const versions = tags
    .map((t) => (t.startsWith("v") ? t.slice(1) : ""))
    .map(parseVersion)
    .filter(Boolean)
    .filter((v) => predicate(v));
  if (versions.length === 0) return null;
  versions.sort((a, b) =>
    a.major !== b.major
      ? a.major - b.major
      : a.minor !== b.minor
        ? a.minor - b.minor
        : a.patch - b.patch
  );
  return versions[versions.length - 1];
}

function loadTagStrategy(projectRoot) {
  const configPath = resolve(projectRoot, "omniguider.config.json");
  if (!existsSync(configPath)) return null;
  try {
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    return config.tagStrategy ?? null;
  } catch {
    return null;
  }
}

function defaultTagStrategy() {
  return {
    test: { major: 0, minor: 0, bump: "patch", initialPatch: 1 },
    uat: { major: 0, bump: "minor", initialMinor: 1 },
    main: { bump: "major", initialMajor: 1 },
  };
}

function nextVersionForBranch(branch, tags, tagStrategy) {
  const strategy = tagStrategy?.[branch];
  if (!strategy) return null;

  const { bump, initialPatch, initialMinor, initialMajor } = strategy;

  if (bump === "patch") {
    const last = latestTag(tags, (v) => v.major === 0 && v.minor === 0);
    const nextPatch = last ? last.patch + 1 : (initialPatch ?? 1);
    return `0.0.${nextPatch}`;
  }

  if (bump === "minor") {
    const last = latestTag(
      tags,
      (v) => v.major === 0 && v.patch === 0 && v.minor >= 1
    );
    const nextMinor = last ? last.minor + 1 : (initialMinor ?? 1);
    return `0.${nextMinor}.0`;
  }

  if (bump === "major") {
    const last = latestTag(
      tags,
      (v) => v.minor === 0 && v.patch === 0 && v.major >= 1
    );
    const nextMajor = last ? last.major + 1 : (initialMajor ?? 1);
    return `${nextMajor}.0.0`;
  }

  return null;
}

function main() {
  if (process.env.SKIP_BUMP === "1") {
    warn("偵測到 SKIP_BUMP=1，略過版號更新、tag 與 push。");
    return;
  }

  const mode = parseMode();
  const commitMessage =
    mode === "stage"
      ? "build: stage"
      : mode === "prod"
        ? "build: prod"
        : "build: uat";

  const __filename = fileURLToPath(import.meta.url);
  const projectRoot = resolve(dirname(__filename), "..");
  const pkgPath = resolve(projectRoot, "package.json");

  const branch = run("git rev-parse --abbrev-ref HEAD");
  const tags = run("git tag --list").split("\n").filter(Boolean);
  const tagStrategy = loadTagStrategy(projectRoot) ?? defaultTagStrategy();

  const next = nextVersionForBranch(branch, tags, tagStrategy);
  if (!next) {
    warn(`分支 "${branch}" 未定義版號規則，略過 bump/tag。`);
    return;
  }

  const newTag = `v${next}`;
  if (tags.includes(newTag)) {
    err(`tag ${newTag} 已存在，請手動處理後再 build。`);
    process.exit(1);
  }

  const pkgRaw = readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(pkgRaw);
  const oldVersion = pkg.version;
  pkg.version = next;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  log(`branch=${branch}  ${oldVersion} → ${next}  mode=${mode}`);

  try {
    // Force-add dist (gitignored) for deploy commits / dist 被 ignore，部署 commit 需強制加入
    run("git add package.json && git add -f dist");

    let hasStagedChange = true;
    try {
      execSync("git diff --cached --quiet", { stdio: "ignore" });
      hasStagedChange = false;
    } catch {
      hasStagedChange = true;
    }

    if (hasStagedChange) {
      run(`git commit --no-verify -m "${commitMessage}"`);
    } else {
      warn("沒有可 commit 的變更，略過 commit，僅補 tag。");
    }

    run(`git tag -a ${newTag} -m "Release ${newTag}"`);
    log(`✓ 已建立 tag ${newTag}`);
  } catch (e) {
    err(`git commit / tag 失敗：${e.message}`);
    process.exit(1);
  }

  if (process.env.SKIP_PUSH === "1") {
    warn("偵測到 SKIP_PUSH=1，跳過 push。");
    return;
  }

  try {
    log(`push 到 origin/${branch}（含 tag）...`);
    const socks5Proxy = process.env.SOCKS5_PROXY;
    const needsSocksSsh =
      typeof socks5Proxy === "string" && socks5Proxy.startsWith("socks5://");
    const socksAddr = needsSocksSsh
      ? socks5Proxy.slice("socks5://".length)
      : null;
    const baseEnv = process.env;

    const env = needsSocksSsh
      ? {
          ...baseEnv,
          GIT_SSH_COMMAND: `ssh -o ProxyCommand="nc -X 5 -x ${socksAddr} %h %p"`,
        }
      : baseEnv;

    execSync(`git push --follow-tags --no-verify origin ${branch}`, {
      stdio: "inherit",
      env,
    });
    log(`✓ 已 push 到 origin/${branch}`);
  } catch (e) {
    warn("⚠ push 失敗（commit 與 tag 已建立在本地）。可手動補 push：");
    warn(`    git push --follow-tags origin ${branch}`);
    warn(`錯誤摘要：${e.message}`);
  }
}

main();
