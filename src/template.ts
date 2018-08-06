import * as fs from "fs"
import * as path from "path"
import * as util from "util"
import { MarkdownEntry } from "./autoblog"
import config from "./config"
import format from "./format"

class VueTemplate {
  public readonly template: string = fs.readFileSync(
    path.resolve(__dirname, "../../", "src", "templates", "vue", "template.vue"),
    "utf8",
  )

  public readonly script: string = fs.readFileSync(
    path.resolve(__dirname, "../../", "src", "templates", "vue", "script.vue"),
    "utf8",
  )

  public generate(entry: MarkdownEntry): string {
    let html = entry.markdown.parseToHTML()
    if (html.endsWith("\n")) {
      html = html.substring(0, html.length - 1)
    }

    const id = entry.fileInfo.name
    const classNames =
      entry.markdown.frontMatter && entry.markdown.frontMatter.style !== undefined
        ? entry.markdown.frontMatter.style   // front-matter style name override
        : config.defaultStyle                // default style from config

    const idStr = classNames
      ? `id="${format.pascalToKebab(id)}" class="${classNames}"`
      : `id="${format.pascalToKebab(id)}"`

    const template = format.formatHtml(util.format(this.template, idStr, html))

    // output meta-info from frontmatter
    if (config.vue && config.vue.outputMeta && entry.markdown.frontMatter) {
      const metaInfo = this.createMetaInfo(entry.markdown.frontMatter)
      const metaScript = format.formatScript(util.format(this.script, util.inspect(metaInfo)))
      return template + `\n<script>\n${metaScript}</script>\n`
    }
    return template
  }

  private createMetaInfo(frontMatter: any): object {
    // extract root-level title and place inside meta obj
    const metaInfo = frontMatter.metaInfo ? frontMatter.metaInfo : {}
    // take meta-info title from default root-level title if it exists
    if (frontMatter.title && !metaInfo.title) {
      metaInfo.title = frontMatter.title
    }
    return metaInfo
  }
}

export default {
  vue: new VueTemplate(),
}
