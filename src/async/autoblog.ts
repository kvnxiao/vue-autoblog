import * as markdownit from "markdown-it"
import * as cfg from "./config"
import FileInfo from "./file"
import * as files from "./files"
import readMarkdown, { MarkdownFile } from "./md"
import * as vue from "./vue-templater"

export interface ParsedFile {
  input: FileInfo
  output: FileInfo
  markdown: MarkdownFile
  html: string
}

export async function generate(config: cfg.AutoblogConfig) {
  // get list of .md files in input directory
  const dirInfo = await files.listDir(config.directory.inputFolder, ".md")

  // create output parent directories
  await files.mkdirp(config.directory.outputFolder)

  for (const dir of dirInfo.directories) {
    const outDir = files.replaceDir(dir, config.directory.inputFolder, config.directory.outputFolder)
    await files.mkdirp(outDir)
  }

  const mdparser = new markdownit(config.markdownit)
  const entries = dirInfo.files.map(it => FileInfo.of(it)).map(async it => {
    const markdown = await readMarkdown(it.fullPath)
    const parsedFile: ParsedFile = {
      input: it,
      output: it.changeTo({
        extension: config.outputType,
        replaceDir: {
          startFrom: config.directory.inputFolder,
          to: config.directory.outputFolder,
        },
      }),
      markdown,
      html: mdparser.render(markdown.rawContent),
    }
    return parsedFile
  })

  const parsedFiles = await Promise.all(entries)
  switch (config.outputType) {
    case "vue":
      generateVue(parsedFiles, config)
      break
    default:
      break
  }
}

async function generateVue(entries: ParsedFile[], config: cfg.AutoblogConfig) {
  const templater = await vue.templater(config.typescript)

  // write .vue templates
  entries.forEach(it => {
    const vueTemplate = templater.generateTemplate(it, config)
    files.writeFile(it.output.fullPath, vueTemplate, files.UTF8)
  })

  // TODO: write routes
  // TODO: write posts info
}
