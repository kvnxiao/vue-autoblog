import * as fs from "fs"
import * as markdownit from "markdown-it"
import * as path from "path"
import * as prettier from "prettier"

const outputTypes = {
  html: true,
  vue: true,
}

interface DirectoryOptions {
  inputFolder: string
  outputFolder: string
}

interface VueOptions {
  outputMeta: boolean
}

interface IConfig {
  // markdown-it options
  markdownit: markdownit.Options

  // directory to parse for generating files
  directory: DirectoryOptions

  // css style options
  defaultStyle?: string

  // output type
  outputType: string

  // using typescript
  typescript?: boolean

  // vue options
  vue?: VueOptions
}

class Config implements IConfig {
  public static load(): Config {
    return new Config()
  }

  public readonly markdownit: markdownit.Options
  public readonly directory: DirectoryOptions
  public readonly defaultStyle?: string
  public readonly outputType: string
  public readonly vue?: VueOptions
  public readonly typescript?: boolean
  public readonly prettierConfig: prettier.Options

  private constructor() {
    const configJson = fs.readFileSync(path.resolve(".", ".autoblog.json"), "utf8")
    const configContent = JSON.parse(configJson) as IConfig

    this.directory = configContent.directory
    this.markdownit = configContent.markdownit
    this.outputType = configContent.outputType
    this.defaultStyle = configContent.defaultStyle
    this.typescript = configContent.typescript
    this.vue = configContent.vue
    this.prettierConfig = prettier.resolveConfig.sync(path.resolve(".", ".package.json")) || {}
    this.prettierConfig.parser = "babylon"

    if (!this.validate()) {
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
      console.error(
        `Failed to read input folder "${
          this.directory.inputFolder
        }". Make sure this directory exists!`,
      )
      return false
    }
    return true
  }
}

const config = Config.load()
export default config
