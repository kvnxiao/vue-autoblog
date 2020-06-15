import * as markdownit from "markdown-it"
import * as path from "path"
import * as cfg from "./config"
import FileInfo from "./file"
import * as files from "./files"
import readMarkdown, { MarkdownFile } from "./md"
import * as vue from "./vue"
import * as vuetemplater from "./vue-templater"

export interface ParsedFile {
  input: FileInfo
  output: FileInfo
  markdown: MarkdownFile
  html: string
}

export async function generate(config: cfg.AutoblogConfig): Promise<void> {
  // get list of .md files in input directory
  const dirInfo = await files.listDir(config.directory.inputFolder, ".md")

  // create output parent directories
  await files.mkdirp(config.directory.outputFolder)

  for (const dir of dirInfo.directories) {
    if (!dir.endsWith(path.join("/", "layouts"))) {
      const outDir = files.replaceDir(dir, config.directory.inputFolder, config.directory.outputFolder)
      await files.mkdirp(outDir)
    }
  }

  const mdparser = new markdownit(config.markdownit)
  const entries = dirInfo.files
    .map(it => FileInfo.of(it))
    .map(async it => {
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

async function generateVue(entries: ParsedFile[], config: cfg.AutoblogConfig): Promise<void> {
  const templater = await vuetemplater.NewTemplater(config)

  const vueEntries = entries.map(it => vue.parse(it, config.directory.outputFolder))

  const vueEntriesComponents: vue.ParsedVueFile[] = []
  const vueEntriesViews: vue.ParsedVueFile[] = []
  for (const entry of vueEntries) {
    if (entry.metadata.isComponent) {
      vueEntriesComponents.push(entry)
    } else {
      vueEntriesViews.push(entry)
    }
  }

  const vueEntriesWithoutDates = vueEntriesViews.filter(it => !it.metadata.date)
  const vueEntriesWithDates = vueEntriesViews.filter(it => it.metadata.date).sort(it => it.metadata.date!.getTime())

  // write .vue files
  for (let i = 0; i < vueEntriesWithDates.length; i++) {
    const curr = vueEntriesWithDates[i]
    const prev = i - 1 >= 0 ? vueEntriesWithDates[i - 1].metadata : undefined
    const next = i + 1 < vueEntriesWithDates.length ? vueEntriesWithDates[i + 1].metadata : undefined
    const vueTemplate = templater.generate(curr, { prev, next })
    files.writeFile(curr.output.fullPath, vueTemplate, { encoding: "utf8" }).then(() => {
      console.log(`Completed generating "${curr.output.fullPath}"`)
    })
  }
  for (const entry of vueEntriesWithoutDates) {
    const vueTemplate = templater.generate(entry)
    files.writeFile(entry.output.fullPath, vueTemplate, { encoding: "utf8" }).then(() => {
      console.log(`Completed generating "${entry.output.fullPath}"`)
    })
  }
  for (const entry of vueEntriesComponents) {
    const vueTemplate = templater.generate(entry)
    files.writeFile(entry.output.fullPath, vueTemplate, { encoding: "utf8" }).then(() => {
      console.log(`Completed generating "${entry.output.fullPath}"`)
    })
  }

  // get routes
  const routesPath = path.join(config.directory.outputFolder, vuetemplater.AUTO_ROUTES)
  const routes = templater.generateRoutes(
    vueEntriesViews.map(it => it.routeEntry),
    config.vue.lazyRoutes,
  )
  files.writeFile(routesPath, routes, { encoding: "utf8" }).then(() => {
    console.log(`Completed generating "${routesPath}"`)
  })

  // get posts info
  const postsPath = path.join(config.directory.outputFolder, vuetemplater.AUTO_POSTS)
  const posts = templater.generatePosts(
    // output undated posts before dated posts
    vueEntriesWithoutDates
      .map(vuetemplater.extractPostEntries)
      .concat(vueEntriesWithDates.map(vuetemplater.extractPostEntries)),
  )
  files.writeFile(postsPath, posts, { encoding: "utf8" }).then(() => {
    console.log(`Completed generating "${postsPath}"`)
  })

  if (config.vue.prerender) {
    const prerenderRoutes = templater.generatePrerenderRoutes(vueEntriesViews.map(it => it.routeEntry))
    files.writeFile(path.resolve(".", "prerender-routes.js"), prerenderRoutes, { encoding: "utf8" }).then(() => {
      console.log(`Completed generating prerendered routes in "prerender-routes.js"`)
    })
  }

  if (config.typescript) {
    generateVueTypings(templater, config)
  }
}

async function generateVueTypings(templater: vuetemplater.VueTemplater, config: cfg.AutoblogConfig) {
  const routeTypings = path.join(config.directory.outputFolder, vuetemplater.AUTO_ROUTES_TYPINGS)
  if (!(await files.exists(routeTypings))) {
    files.writeFile(routeTypings, templater.generateRouteTypings(), { encoding: "utf8" }).then(() => {
      console.log(`Completed generating "${routeTypings}"`)
    })
  } else {
    console.log(`File "${routeTypings}" already exists, skipping write.`)
  }

  const postTypings = path.join(config.directory.outputFolder, vuetemplater.AUTO_POSTS_TYPINGS)
  if (!(await files.exists(postTypings))) {
    files.writeFile(postTypings, templater.generatePostTypings(), { encoding: "utf8" }).then(() => {
      console.log(`Completed generating "${postTypings}"`)
    })
  } else {
    console.log(`File "${postTypings}" already exists, skipping write.`)
  }
}
