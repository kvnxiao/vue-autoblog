import * as fs from "fs"
import * as markdownit from "markdown-it"
import * as path from "path"
import * as prettier from "prettier"

const outputTypes = {
  html: true,
  vue: true,
}

interface VueOptions {
  outputMeta: boolean
}

interface DirectoryOptions {
  inputFolder: string
  outputFolder: string
}

interface AutoblogConfigFile {
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

class Config {
  public readonly directory: DirectoryOptions
  public readonly markdownitOptions: markdownit.Options
  public readonly outputType: string
  public readonly vueOptions: VueOptions
  public readonly useTypescript: boolean
  public readonly defaultCssStyle?: string
  public readonly prettierConfig: prettier.Options

  // Load config files synchronously as the config is referenced in many other class methods
  constructor() {
    const config = fs.readFileSync(path.resolve(".", ".autoblog.json"), { encoding: "utf8" })
    const configJson = JSON.parse(config) as AutoblogConfigFile

    this.outputType = configJson.outputType || "vue"
    this.markdownitOptions = configJson.markdownit || {
      linkify: true,
      typographer: true,
      xhtmlOut: true,
    }
    this.vueOptions = configJson.vue || {
      outputMeta: true,
    }
    this.useTypescript = configJson.typescript || false
    this.defaultCssStyle = configJson.defaultStyle
    this.prettierConfig = prettier.resolveConfig.sync(path.resolve(".", "package.json")) || {}
    if (!this.prettierConfig.parser) {
      this.prettierConfig.parser = "babylon"
    }
    this.directory = configJson.directory || {
      inputFolder: "src/md/",
      outputFolder: "src/autoblog/",
    }

    this.validate()
  }

  private validate() {
    if (!(this.outputType in outputTypes)) {
      throw new Error("ERROR: Unsupported outputType in config!")
    }

    // check if input exists
    if (!fs.existsSync(this.directory.inputFolder)) {
      throw new Error(
        `ERROR: Failed to read input folder ${this.directory.inputFolder}. Make sure this directory exists!`,
      )
    }
  }
}

export default new Config()
