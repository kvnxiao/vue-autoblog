import * as fs from "fs"
import config from "./config"
import files, { FileInfo } from "./files"
import md, { MarkdownFile } from "./md"
import template from "./template"

const inputType = ".md"
const inputTypeExt = "md"

export interface MarkdownEntry {
  fileInfo: FileInfo
  markdown: MarkdownFile
}

function generate() {
  // get list of .md files in input directory
  const dirInfo = files.listDirectory(config.directory.inputFolder, inputType)

  // clean output folder
  files.deleteDirectory(config.directory.outputFolder)

  // create output parent directories
  if (!files.mkdirp(config.directory.outputFolder)) {
    throw new Error(`Failed to create output folder ${config.directory.outputFolder}`)
  }
  for (const dir of dirInfo.directories) {
    const outDir = files.replaceDir(
      dir,
      config.directory.inputFolder,
      config.directory.outputFolder,
    )
    if (!files.mkdirp(outDir)) {
      throw new Error(`Failed to create parent directories for ${outDir}`)
    }
  }

  // transform each file path into an entry
  const entries = dirInfo.files
    .map(it => new FileInfo(it))
    .filter(it => it.extension === inputTypeExt)
    .map(it => {
      return {
        fileInfo: it.changeTo({
          extension: config.outputType,
          replaceDir: {
            startFrom: config.directory.inputFolder,
            to: config.directory.outputFolder,
          },
        }),
        markdown: md.readMd(it.fullPath),
      }
    })
    .map(it => {
      // render and save to output based on output type
      switch (config.outputType) {
        case "vue": {
          generateVue(it)
          break
        }
        case "html": {
          generateHtml(it)
          break
        }
      }
      return it
    })
}

function generateVue(entry: MarkdownEntry) {
  const html = entry.markdown.parseToHTML()
  const output = config.style ? template.vue.generate(entry) : template.vue.generate(entry)
  fs.writeFileSync(entry.fileInfo.fullPath, output, { encoding: "utf8" })
}

function generateHtml(entry: MarkdownEntry) {
  const html = entry.markdown.parseToHTML()
  fs.writeFileSync(entry.fileInfo.fullPath, entry.markdown.parseToHTML(), { encoding: "utf8" })
}

export default {
  generate,
}
