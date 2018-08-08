#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const autoblog = require("../src/autoblog");
const config = require("../src/config");
async function main() {
  const configFilePath = path.resolve(".", ".autoblog.json");
  console.log(`Loading config at "${configFilePath}".`);
  const cfg = await config.loadConfig(configFilePath);
  autoblog.generate(cfg);
}
main();
