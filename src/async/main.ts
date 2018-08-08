import * as path from "path"
import * as autoblog from "./autoblog"
import * as config from "./config"

async function main() {
  const configFilePath = path.resolve(".", ".autoblog.json")
  const cfg = await config.loadConfig(configFilePath)
  await autoblog.generate(cfg)
}

main()
