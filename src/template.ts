import * as fs from "fs"
import * as Handlebars from "handlebars"
import * as path from "path"
import { inspect } from "util"
import { MarkdownEntry } from "./autoblog"
import config from "./config"
import format from "./format"
import { PostInfo, RouteInfo } from "./meta"
import meta from "./meta"

export const AUTO_ROUTES = "auto-routes.js"
export const AUTO_ROUTES_TYPINGS = "auto-routes.d.ts"
export const AUTO_POSTS = "auto-entries.js"
export const AUTO_POSTS_TYPINGS = "auto-entries.d.ts"

class VueTemplate {
  public readonly template: string = fs.readFileSync(
    path.resolve(__dirname, "../../", "src", "templates", "vue", "template.vue"),
    "utf8",
  )

  public readonly script: string = fs.readFileSync(
    path.resolve(__dirname, "../../", "src", "templates", "vue", "script.vue"),
    "utf8",
  )

  public readonly routes: string = fs.readFileSync(
    path.resolve(__dirname, "../../", "src", "templates", "vue", AUTO_ROUTES),
    "utf8",
  )

  public readonly routeTypings: string = fs.readFileSync(
    path.resolve(__dirname, "../../", "src", "templates", "vue", AUTO_ROUTES_TYPINGS),
    "utf8",
  )

  public readonly postEntries: string = fs.readFileSync(
    path.resolve(__dirname, "../../", "src", "templates", "vue", AUTO_POSTS),
    "utf8",
  )

  public readonly postTypings: string = fs.readFileSync(
    path.resolve(__dirname, "../../", "src", "templates", "vue", AUTO_POSTS_TYPINGS),
    "utf8",
  )

  public generateVue(entry: MarkdownEntry): string {
    let html = entry.markdown.parseToHTML()
    if (html.endsWith("\n")) {
      html = html.substring(0, html.length - 1)
    }

    const id = entry.fileInfo.name
    const classNames =
      entry.markdown.frontMatter && entry.markdown.frontMatter.style !== undefined
        ? entry.markdown.frontMatter.style // front-matter style name override
        : config.defaultStyle // default style from config

    const idStr = classNames
      ? `id="${format.pascalToKebab(id)}" class="${classNames}"`
      : `id="${format.pascalToKebab(id)}"`

    const template = format.formatHtml(
      compileTemplate(this.template, { attr: idStr, content: html }),
    )

    // output meta-info from frontmatter
    if (config.vue && config.vue.outputMeta && entry.markdown.frontMatter) {
      const metaInfo = meta.createMetaInfo(entry.markdown.frontMatter)
      const metaScript = format.formatScript(
        compileTemplate(this.script, { metaInfo: inspect(metaInfo) }),
      )
      return Object.keys(metaInfo).length > 0
        ? template + `\n<script>\n${metaScript}</script>\n`
        : template
    }
    return template
  }

  public generateRoutes(routes: RouteInfo[]): string {
    const imports = routes.map(it => it.getImport()).join("\n")
    const list = routes.map(it => it.toString()).join(",\n")
    return format.formatScript(compileTemplate(this.routes, { imports, list }))
  }

  public generatePostEntries(posts: PostInfo[]): string {
    const s = posts
      .filter(it => Object.keys(it).length > 0)
      .map(it => inspect(it))
      .join(",\n")
    return format.formatScript(compileTemplate(this.postEntries, s))
  }
}

function compileTemplate(content: string, context: any): string {
  return Handlebars.compile(content)(context)
}

export const vue = new VueTemplate()
