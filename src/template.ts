import { ParsedFile } from "./autoblog"
import { AutoblogConfig } from "./config"

export default interface Templater {
  generate(entry: ParsedFile, config: AutoblogConfig): string
}
