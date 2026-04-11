#!/usr/bin/env node
import { spawnSync } from "node:child_process";

// Support both: pnpm release "msg" and pnpm release -- "msg"
const message = process.argv
  .slice(2)
  .filter((arg) => arg !== "--")
  .join(" ")
  .trim();

if (!message) {
  console.error('Usage: pnpm release "your commit message"');
  process.exit(1);
}

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const readStdout = (command, args) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return (result.stdout ?? "").trim();
};

console.log("\n>> Staging all changes...");
run("git", ["add", "-A"]);

const status = readStdout("git", ["status", "--porcelain"]);
if (status) {
  console.log(`\n>> Committing: ${message}`);
  run("git", ["commit", "-m", message]);
} else {
  console.log("\n>> Nothing to commit, skipping commit step.");
}

console.log("\n>> Bumping version (patch)...");
run("npm", ["version", "patch", "-m", "chore(release): %s"]);

const currentBranch = readStdout("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
if (!currentBranch || currentBranch === "HEAD") {
  console.error("\n✗ Unable to detect current branch. Refusing to push.");
  process.exit(1);
}

console.log("\n>> Pushing commit + tag...");
run("git", ["push", "origin", currentBranch, "--follow-tags"]);

console.log("\n✓ Release pushed! Check GitHub Actions for build status.");
