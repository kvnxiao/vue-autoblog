import * as fs from "fs"
import * as markdownit from "markdown-it"
import files from "./files"

const outputTypes = {
  html: true,
  vue: true,
}

interface DirectoryOptions {
  inputFolder: string
  outputFolder: string
}

interface StyleOptions {
  classNames: string
}

interface IConfig {
  // markdown-it options
  markdownit: markdownit.Options

  // directory to parse for generating files
  directory: DirectoryOptions

  // css style options
  style?: StyleOptions

  // output type
  outputType: string
}

class Config implements IConfig {
  public static load(): Config {
    return new Config()
  }

  public readonly markdownit: markdownit.Options
  public readonly directory: DirectoryOptions
  public readonly style: StyleOptions | undefined
  public readonly outputType: string

  private constructor() {
    const buf = fs.readFileSync(".autoblog.json")
    const configContent = JSON.parse(buf.toString("utf8")) as IConfig

    this.directory = configContent.directory
    this.markdownit = configContent.markdownit
    this.outputType = configContent.outputType
    this.style = configContent.style

    if (!(this.validate())) {
      throw new Error("failed to validate config.")
    }
  }

  private validate(): boolean {
    if (!(this.outputType in outputTypes)) {
      console.error(`ERROR: Unsupported outputType in config`)
      return false
    }

    // validate input dir exists
    const inputExists = fs.existsSync(this.directory.inputFolder)
    if (!inputExists) {
      console.error(`Failed to read input folder "${
        this.directory.inputFolder
      }". Make sure this directory exists!`)
      return false
    }
    return true
  }
}

const config = Config.load()
export default config
