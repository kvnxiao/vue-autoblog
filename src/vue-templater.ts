import * as handlebars from "handlebars"
import * as path from "path"
import { inspect } from "util"
import { ParsedFile } from "./autoblog"
import { AutoblogConfig } from "./config"
import * as files from "./files"
import format from "./format"
import { extractMetaInfo, PostInfo, RouteInfo } from "./meta"
import Templater from "./template"

export const VUE_TEMPLATE = "template.vue"
export const VUE_SCRIPT = "script.vue"
export const AUTO_ROUTES = "auto-routes.js"
export const AUTO_ROUTES_TYPINGS = "auto-routes.d.ts"
export const AUTO_POSTS = "auto-entries.js"
export const AUTO_POSTS_TYPINGS = "auto-entries.d.ts"
export const HANDLEBARS_EXT = ".hbs"

export class VueTemplater implements Templater {
  private readonly template: string
  private readonly script: string
  private readonly routes: string
  private readonly posts: string
  private readonly routeTypings?: string
  private readonly postTypings?: string

  constructor(
    template: string,
    script: string,
    routes: string,
    posts: string,
    routeTypings?: string,
    postTypings?: string,
  ) {
    this.template = template
    this.script = script
    this.routes = routes
    this.posts = posts
    this.routeTypings = routeTypings
    this.postTypings = postTypings
  }

  public generate(entry: ParsedFile, config: AutoblogConfig): string {
    const template = this.generateTemplate(entry, config)
    const script = this.generateScript(entry, config)
    return script ? `${template}\n<script>\n${script}</script>\n` : template
  }

  public generateRoutes(routes: RouteInfo[], config: AutoblogConfig): string {
    const imports = routes.map(it => it.getImport()).join("\n")
    const list = routes.map(it => it.toString()).join(",\n")
    return format.formatScript(compileTemplate(this.routes, { imports, list }), config.prettierConfig)
  }

  public generatePosts(posts: PostInfo[], config: AutoblogConfig): string {
    const entries = posts
      .filter(it => Object.keys(it).length > 0)
      .map(it => inspect(it))
      .join(",\n")
    return format.formatScript(compileTemplate(this.posts, { entries }), config.prettierConfig)
  }

  public generateRouteTypings(): string {
    return this.routeTypings!
  }

  public generatePostTypings(): string {
    return this.postTypings!
  }

  private generateTemplate(entry: ParsedFile, config: AutoblogConfig): string {
    // clear extra new-line at end of rendered HTML
    const html = entry.html.endsWith("\n") ? entry.html.substring(0, entry.html.length - 1) : entry.html

    const id = entry.output.name
    const classNames =
      entry.markdown.frontMatter && entry.markdown.frontMatter.style !== undefined
        ? entry.markdown.frontMatter.style // front-matter style name override
        : config.defaultStyle // default style from config

    const attr = classNames
      ? `id="${format.pascalToKebab(id)}" class="${classNames}"`
      : `id="${format.pascalToKebab(id)}"`

    const templatedHtml = format.formatHtml(
      compileTemplate(this.template, {
        attr,
        content: html,
      }),
      config.prettierConfig,
    )
    return templatedHtml
  }

  private generateScript(entry: ParsedFile, config: AutoblogConfig): string | null {
    // output meta-info from markdown front-matter
    if (config.vue && config.vue.outputMeta && entry.markdown.frontMatter) {
      const metaInfo = extractMetaInfo(entry.markdown.frontMatter)
      if (Object.keys(metaInfo).length > 0) {
        const templatedScript = format.formatScript(
          compileTemplate(this.script, { metaInfo: inspect(metaInfo) }),
          config.prettierConfig,
        )
        return templatedScript
      }
    }
    return null
  }
}

export async function templater(isTypescript: boolean): Promise<VueTemplater> {
  const rootPath = path.resolve(__dirname, "templates", "vue")

  const template = await files.readFile(path.resolve(rootPath, VUE_TEMPLATE + HANDLEBARS_EXT), files.UTF8)
  const script = await files.readFile(path.resolve(rootPath, VUE_SCRIPT + HANDLEBARS_EXT), files.UTF8)
  const routes = await files.readFile(path.resolve(rootPath, AUTO_ROUTES + HANDLEBARS_EXT), files.UTF8)
  const posts = await files.readFile(path.resolve(rootPath, AUTO_POSTS + HANDLEBARS_EXT), files.UTF8)

  if (isTypescript) {
    const routeTypings = await files.readFile(path.resolve(rootPath, AUTO_ROUTES_TYPINGS), files.UTF8)
    const postTypings = await files.readFile(path.resolve(rootPath, AUTO_POSTS_TYPINGS), files.UTF8)
    return new VueTemplater(template, script, routes, posts, routeTypings, postTypings)
  }
  return new VueTemplater(template, script, routes, posts)
}

function compileTemplate(content: string, context: any): string {
  return handlebars.compile(content)(context)
}
