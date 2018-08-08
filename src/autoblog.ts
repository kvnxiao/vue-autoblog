import * as markdownit from "markdown-it"
import * as path from "path"
import * as cfg from "./config"
import FileInfo from "./file"
import * as files from "./files"
import readMarkdown, { MarkdownFile } from "./md"
import { parseInfo } from "./meta"
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
      return generateVue(parsedFiles, config)
    default:
      throw new Error(`Invalid outputType: "${config.outputType}", no generator function exists for this type.`)
  }
}

async function generateVue(entries: ParsedFile[], config: cfg.AutoblogConfig) {
  const templater = await vue.templater(config.typescript)

  // write .vue templates
  const writeFiles = entries.map(async it => {
    const vueTemplate = templater.generate(it, config)
    return files.writeFile(it.output.fullPath, vueTemplate, files.UTF8)
  })
  Promise.all(writeFiles).then(_ => {
    console.log(`Completed generating .vue files in "${config.directory.outputFolder}"`)
  })

  const entryInfos = entries.map(it => parseInfo(it, config.directory.outputFolder))

  // get routes
  const routesPath = path.join(config.directory.outputFolder, vue.AUTO_ROUTES)
  const routes = templater.generateRoutes(entryInfos.map(it => it.routeInfo), config)
  files.writeFile(routesPath, routes, files.UTF8).then(_ => {
    console.log(`Completed generating "${routesPath}"`)
  })

  // get posts info
  const postsPath = path.join(config.directory.outputFolder, vue.AUTO_POSTS)
  const posts = templater.generatePosts(entryInfos.map(it => it.postInfo), config)
  files.writeFile(postsPath, posts, files.UTF8).then(_ => {
    console.log(`Completed generating "${postsPath}"`)
  })

  if (config.typescript) {
    const routeTypings = path.join(config.directory.outputFolder, vue.AUTO_ROUTES_TYPINGS)
    if (!await files.exists(routeTypings)) {
      files.writeFile(routeTypings, templater.generateRouteTypings(), files.UTF8).then(_ => {
        console.log(`Completed generating "${routeTypings}"`)
      })
    } else {
      console.log(`File "${routeTypings}" already exists, skipping write.`)
    }

    const postTypings = path.join(config.directory.outputFolder, vue.AUTO_POSTS_TYPINGS)
    if (!await files.exists(postTypings)) {
      files.writeFile(postTypings, templater.generatePostTypings(), files.UTF8).then(_ => {
        console.log(`Completed generating "${postTypings}"`)
      })
    } else {
      console.log(`File "${postTypings}" already exists, skipping write.`)
    }
  }
}
