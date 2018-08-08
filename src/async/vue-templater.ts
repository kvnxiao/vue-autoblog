import * as handlebars from "handlebars"
import * as path from "path"
import { ParsedFile } from "./autoblog"
import { AutoblogConfig } from "./config"
import * as files from "./files"
import format from "./format"

export const VUE_TEMPLATE = "template.vue"
export const VUE_SCRIPT = "script.vue"
export const AUTO_ROUTES = "auto-routes.js"
export const AUTO_ROUTES_TYPINGS = "auto-routes.d.ts"
export const AUTO_POSTS = "auto-entries.js"
export const AUTO_POSTS_TYPINGS = "auto-entries.d.ts"
export const HANDLEBARS_EXT = ".hbs"

export class VueTemplater {
  private readonly isTypescript: boolean
  private readonly template: string
  private readonly script: string
  private readonly routes: string
  private readonly posts: string
  private readonly routeTypings?: string
  private readonly postTypings?: string

  constructor(
    isTypescript: boolean,
    template: string,
    script: string,
    routes: string,
    posts: string,
    routeTypings?: string,
    postTypings?: string,
  ) {
    this.isTypescript = isTypescript
    this.template = template
    this.script = script
    this.routes = routes
    this.posts = posts
    this.routeTypings = routeTypings
    this.postTypings = postTypings
  }

  public generateTemplate(entry: ParsedFile, config: AutoblogConfig): string {
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

    const templatedHtml = format.formatHtml(compileTemplate(this.template, {
      attr,
      content: html,
    }), config.prettierConfig)

    // output meta-info from frontmatter
    if (config.vue && config.vue.outputMeta && entry.markdown.frontMatter) {
      // TODO: implement meta
      return templatedHtml
    }
    return templatedHtml
  }
}

export async function templater(isTypescript: boolean): Promise<VueTemplater> {
  const rootPath = path.resolve(__dirname, "../../../", "src", "templates", "vue")

  const template = await files.readFile(path.resolve(rootPath, VUE_TEMPLATE + HANDLEBARS_EXT), files.UTF8)
  const script = await files.readFile(path.resolve(rootPath, VUE_SCRIPT + HANDLEBARS_EXT), files.UTF8)
  const routes = await files.readFile(path.resolve(rootPath, AUTO_ROUTES + HANDLEBARS_EXT), files.UTF8)
  const posts = await files.readFile(path.resolve(rootPath, AUTO_POSTS + HANDLEBARS_EXT), files.UTF8)

  if (isTypescript) {
    const routeTypings = await files.readFile(path.resolve(rootPath, AUTO_ROUTES_TYPINGS), files.UTF8)
    const postTypings = await files.readFile(path.resolve(rootPath, AUTO_POSTS_TYPINGS), files.UTF8)
    return new VueTemplater(isTypescript, template, script, routes, posts, routeTypings, postTypings)
  }
  return new VueTemplater(isTypescript, template, script, routes, posts)
}

function compileTemplate(content: string, context: any): string {
  return handlebars.compile(content)(context)
}
