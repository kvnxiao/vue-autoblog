import * as fs from "fs"
import * as path from "path"
import * as util from "util"
import { MarkdownEntry } from "./autoblog"
import config from "./config"
import format from "./format"

class VueTemplate {
  public readonly template: string = fs.readFileSync(
    path.resolve(__dirname, "../templates/template.vue"),
    "utf8",
  )

  public generate(entry: MarkdownEntry): string {
    const html = entry.markdown.rawContent
    const id = entry.fileInfo.name
    const classNames = config.style ? config.style.classNames : undefined

    const idStr = classNames
      ? `id="${format.pascalToKebab(id)}" class="${classNames}"`
      : `id="${format.pascalToKebab(id)}"`

    if (config.vue && config.vue.outputMeta) {
      if (entry.markdown.frontMatter && entry.markdown.frontMatter.metaInfo) {
        const metaInfo = entry.markdown.frontMatter.metaInfo
        return format.formatHtml(util.format(this.template, idStr, html, util.inspect(metaInfo)))
      }
    }
    return format.formatHtml(util.format(this.template, idStr, html, ""))
  }
}

export default {
  vue: new VueTemplate(),
}
