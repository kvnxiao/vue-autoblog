import * as fs from "fs"
import * as path from "path"
import * as util from "util"
import { MarkdownEntry } from "./autoblog"
import config from "./config"
import format from "./format"

class VueTemplate {
  public readonly template: string = fs.readFileSync(
    path.resolve(".", "src", "templates", "vue", "template.vue"),
    "utf8",
  )

  public readonly script: string = fs.readFileSync(
    path.resolve(".", "src", "templates", "vue", "script.vue"),
    "utf8",
  )

  public generate(entry: MarkdownEntry): string {
    let html = entry.markdown.parseToHTML()
    if (html.endsWith("\n")) {
      html = html.substring(0, html.length - 1)
    }

    const id = entry.fileInfo.name
    const classNames = config.style ? config.style.classNames : undefined

    const idStr = classNames
      ? `id="${format.pascalToKebab(id)}" class="${classNames}"`
      : `id="${format.pascalToKebab(id)}"`

    const template = format.formatHtml(util.format(this.template, idStr, html))
    if (config.vue && config.vue.outputMeta) {
      if (entry.markdown.frontMatter && entry.markdown.frontMatter.metaInfo) {
        const metaInfo = entry.markdown.frontMatter.metaInfo
        const metaScript = format.formatScript(util.format(this.script, util.inspect(metaInfo)))
        return template + `\n<script>\n${metaScript}</script>\n`
      }
    }
    return template
  }
}

export default {
  vue: new VueTemplate(),
}
