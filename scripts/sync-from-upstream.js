#!/usr/bin/env node
/**
 * Syncs registry SOURCE FILES from shadcn-vue upstream.
 *
 * This script updates only the registry/ FOLDER (upstream source for reference
 * and for copying new components). It does NOT modify registry.json.
 *
 * Usage:
 *   node scripts/sync-from-upstream.js
 *
 * Set UPSTREAM_PATH to override the upstream repo location (default: ../shadcn-vue)
 */

import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const upstreamPath =
  process.env.UPSTREAM_PATH || path.resolve(rootDir, "..", "shadcn-vue");
const upstreamRegistry = path.join(upstreamPath, "apps", "v4", "registry");
const targetRegistry = path.join(rootDir, "registry");

if (!existsSync(upstreamRegistry)) {
  console.error("Upstream registry not found at:", upstreamRegistry);
  console.error("Set UPSTREAM_PATH if shadcn-vue is elsewhere.");
  process.exit(1);
}

console.log("Syncing from:", upstreamPath);
console.log("  registry/ -> registry/ (source files only)");

rmSync(targetRegistry, { recursive: true, force: true });
cpSync(upstreamRegistry, targetRegistry, { recursive: true });

console.log(
  "  registry.json is NOT modified (registry is limited to custom/overridden components only).",
);
console.log("Sync complete.");
