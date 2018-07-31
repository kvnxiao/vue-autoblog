import * as fs from "fs"
import * as path from "path"
import * as util from "util"
import format from "./format"

class VueTemplate {
  public readonly template: string = fs.readFileSync(
    path.resolve(__dirname, "../templates/template.vue"),
    "utf8",
  )

  public generate(html: string, pascalCaseId: string, classNames?: string): string {
    const id = format.pascalToKebab(pascalCaseId)
    const idStr = classNames
      ? `id="${id}" class="${classNames}"`
      : `id="${id}"`
    return format.formatHtml(util.format(this.template, idStr, html))
  }
}

export default {
  vue: new VueTemplate(),
}
