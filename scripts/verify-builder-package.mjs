#!/usr/bin/env node
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const asar = require("@electron/asar");
const pkg = require("../package.json");

const appAsarPath =
  process.argv[2] ||
  path.join(
    process.cwd(),
    "release",
    pkg.version,
    "win-unpacked",
    "resources",
    "app.asar",
  );

const rootModules = ["electron-updater", "builder-util-runtime"];

if (!existsSync(appAsarPath)) {
  console.error(`Missing app.asar: ${appAsarPath}`);
  process.exit(1);
}

const files = asar.listPackage(appAsarPath);
const fileSet = new Set(files);

function getPackageJsonPath(moduleName) {
  return `\\node_modules\\${moduleName}\\package.json`;
}

function readPackageJson(moduleName) {
  const packageJsonPath = getPackageJsonPath(moduleName);
  if (!fileSet.has(packageJsonPath)) return null;

  const asarPath = packageJsonPath.slice(1);
  return JSON.parse(asar.extractFile(appAsarPath, asarPath).toString("utf8"));
}

const missingModules = [];
const checkedModules = new Set();
const queue = [...rootModules];

while (queue.length > 0) {
  const moduleName = queue.shift();
  if (!moduleName || checkedModules.has(moduleName)) continue;

  const modulePackage = readPackageJson(moduleName);
  if (!modulePackage) {
    missingModules.push(moduleName);
    continue;
  }

  checkedModules.add(moduleName);

  for (const dependencyName of Object.keys(modulePackage.dependencies ?? {})) {
    if (!checkedModules.has(dependencyName)) {
      queue.push(dependencyName);
    }
  }
}

if (missingModules.length > 0) {
  console.error(`Packaged app is missing modules: ${missingModules.join(", ")}`);
  process.exit(1);
}

console.log(
  `Packaged updater dependency graph verified in ${path.relative(
    process.cwd(),
    appAsarPath,
  )} (${checkedModules.size} modules)`,
);
