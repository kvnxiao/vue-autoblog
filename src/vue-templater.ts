import * as handlebars from "handlebars"
import * as path from "path"
import { inspect } from "util"
import { ParsedFile } from "./autoblog"
import { AutoblogConfig } from "./config"
import * as files from "./files"
import format from "./format"
import { extractMetaInfo, MetaInfo, PostInfo, RouteInfo } from "./meta"
import Templater from "./template"

export const VUE_TEMPLATE = "template.vue"
export const VUE_SCRIPT = "script.vue"
export const AUTO_ROUTES = "auto-routes.js"
export const AUTO_ROUTES_TYPINGS = "auto-routes.d.ts"
export const AUTO_POSTS = "auto-entries.js"
export const AUTO_POSTS_TYPINGS = "auto-entries.d.ts"
export const HANDLEBARS_EXT = ".hbs"
export const LAYOUTS_FOLDER = "layouts"

interface Layout {
  [key: string]: string
}

export class VueTemplater implements Templater {
  private readonly template: string
  private readonly script: string
  private readonly routes: string
  private readonly posts: string
  private readonly routeTypings?: string
  private readonly postTypings?: string
  private readonly layouts: Layout
  private readonly config: AutoblogConfig

  constructor(
    config: AutoblogConfig,
    template: string,
    script: string,
    routes: string,
    posts: string,
    layouts: Layout,
    routeTypings?: string,
    postTypings?: string,
  ) {
    this.config = config
    this.template = template
    this.script = script
    this.routes = routes
    this.posts = posts
    this.layouts = layouts
    this.routeTypings = routeTypings
    this.postTypings = postTypings
  }

  public generate(entry: ParsedFile): string {
    const metaInfo = extractMetaInfo(entry.markdown.frontMatter)
    const template = this.generateTemplate(entry, metaInfo)
    const script = this.generateScript(entry, metaInfo)
    return script ? `${template}\n<script>\n${script}</script>\n` : template
  }

  public generateRoutes(routes: RouteInfo[]): string {
    const imports = routes.map(it => it.getImport()).join("\n")
    const list = routes.map(it => it.toString()).join(",\n")
    return format.formatScript(compileTemplate(this.routes, { imports, list }), this.config.prettierConfig)
  }

  public generatePosts(posts: PostInfo[]): string {
    const entries = posts
      .filter(it => Object.keys(it).length > 0)
      .map(it => inspect(it))
      .join(",\n")
    return format.formatScript(compileTemplate(this.posts, { entries }), this.config.prettierConfig)
  }

  public generateRouteTypings(): string {
    return this.routeTypings!
  }

  public generatePostTypings(): string {
    return this.postTypings!
  }

  private generateTemplate(entry: ParsedFile, metaInfo: MetaInfo): string {
    // clear extra new-line at end of rendered HTML
    const html = entry.html.endsWith("\n") ? entry.html.substring(0, entry.html.length - 1) : entry.html

    const name = format.pascalToKebab(entry.output.name)

    if (metaInfo.layout && this.layouts[metaInfo.layout]) {
      const layout = this.layouts[metaInfo.layout]
      return format.formatHtml(
        compileTemplate(layout, {
          content: html,
          post: {
            name,
          },
        }),
        this.config.prettierConfig,
      )
    } else {
      const classNames = metaInfo.style || this.config.defaultStyle
      const attr = classNames ? `id="${name}" class="${classNames}"` : `id="${name}"`

      return format.formatHtml(
        compileTemplate(this.template, {
          attr,
          content: html,
        }),
        this.config.prettierConfig,
      )
    }
  }

  private generateScript(entry: ParsedFile, metaInfo: MetaInfo): string | null {
    // output meta-info from markdown front-matter
    if (this.config.vue && this.config.vue.outputMeta && entry.markdown.frontMatter) {
      if (Object.keys(metaInfo).length > 0) {
        const templatedScript = format.formatScript(
          compileTemplate(this.script, { metaInfo: inspect(metaInfo) }),
          this.config.prettierConfig,
        )
        return templatedScript
      }
    }
    return null
  }
}

export async function templater(config: AutoblogConfig): Promise<VueTemplater> {
  const rootPath = path.resolve(__dirname, "templates", "vue")

  const template = await files.readFile(path.resolve(rootPath, VUE_TEMPLATE + HANDLEBARS_EXT), files.UTF8)
  const script = await files.readFile(path.resolve(rootPath, VUE_SCRIPT + HANDLEBARS_EXT), files.UTF8)
  const routes = await files.readFile(path.resolve(rootPath, AUTO_ROUTES + HANDLEBARS_EXT), files.UTF8)
  const posts = await files.readFile(path.resolve(rootPath, AUTO_POSTS + HANDLEBARS_EXT), files.UTF8)

  const layouts = await loadLayouts(config.directory.inputFolder)

  if (config.typescript) {
    const routeTypings = await files.readFile(path.resolve(rootPath, AUTO_ROUTES_TYPINGS), files.UTF8)
    const postTypings = await files.readFile(path.resolve(rootPath, AUTO_POSTS_TYPINGS), files.UTF8)
    return new VueTemplater(config, template, script, routes, posts, layouts, routeTypings, postTypings)
  }
  return new VueTemplater(config, template, script, routes, posts, layouts)
}

async function loadLayouts(inputFolder: string): Promise<Layout> {
  const layouts: Layout = {}
  const layoutsFolder = path.join(inputFolder, LAYOUTS_FOLDER)

  // check if layouts folder exists
  const exists = await files.exists(layoutsFolder)
  if (!exists) {
    return layouts
  }

  // read ".vue.hbs" files
  const layoutFiles = (await files.readDir(layoutsFolder)).filter(it => it.endsWith(".vue.hbs"))
  if (layoutFiles.length === 0) {
    return layouts
  }

  for (const layoutName of layoutFiles) {
    const content = await files.readFile(path.join(layoutsFolder, layoutName), files.UTF8)
    const name = format.pascalToKebab(layoutName.substring(0, layoutName.indexOf(".")))
    layouts[name] = content
  }
  return layouts
}

function compileTemplate(content: string, context: any): string {
  return handlebars.compile(content)(context)
}
