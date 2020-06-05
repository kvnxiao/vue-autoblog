import * as path from "path"
import * as prettier from "prettier"
import * as files from "./files"
import MarkdownIt = require("markdown-it")

const outputTypes = {
  html: true,
  vue: true,
}

interface VueOptions {
  outputMeta: boolean
  prerender: boolean
  lazyRoutes: boolean
}

interface DirectoryOptions {
  inputFolder: string
  outputFolder: string
}

export class AutoblogConfig implements Config {
  public readonly markdownit: MarkdownIt.Options
  public readonly directory: DirectoryOptions
  public readonly defaultStyle?: string
  public readonly outputType: string
  public readonly typescript: boolean
  public readonly vue: VueOptions

  public readonly prettierConfig: prettier.Options

  constructor(
    markdownit: MarkdownIt.Options,
    directory: DirectoryOptions,
    defaultStyle: string | undefined,
    outputType: string,
    typescript: boolean,
    vue: VueOptions,
    prettierConfig: prettier.Options,
  ) {
    this.markdownit = markdownit
    this.directory = directory
    this.defaultStyle = defaultStyle
    this.outputType = outputType
    this.typescript = typescript
    this.vue = vue
    this.prettierConfig = prettierConfig
  }
}

export interface Config {
  // markdown-it options
  markdownit: MarkdownIt.Options

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

export async function loadConfig(configPath: string): Promise<AutoblogConfig> {
  const configFile = await files.readFile(configPath, { encoding: "utf8" })
  const json = JSON.parse(configFile)

  const prettierConfig = (await prettier.resolveConfig(path.resolve(configPath))) || {}
  if (!prettierConfig.parser) {
    prettierConfig.parser = "babel"
  }

  const config: AutoblogConfig = new AutoblogConfig(
    json.markdownit || {
      linkify: true,
      typographer: true,
      xhtmlOut: true,
    },
    json.directory || {
      inputFolder: "src/md/",
      outputFolder: "src/autoblog/",
    },
    json.defaultStyle,
    json.outputType || "vue",
    json.typescript || false,
    json.vue || {
      outputMeta: false,
      prerender: false,
      lazyRoutes: false,
    },
    prettierConfig,
  )

  // validate config
  if (!(config.outputType in outputTypes)) {
    throw new Error("ERROR: Unsupported outputType in config!")
  }
  // check if input exists
  const inputFolderExists = await files.exists(config.directory.inputFolder)
  if (!inputFolderExists) {
    throw new Error(
      `ERROR: Failed to read input folder "${config.directory.inputFolder}". Make sure this directory exists!`,
    )
  }

  return config
}
