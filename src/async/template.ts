import * as fs from "fs"
import * as path from "path"
import { promisify } from "util"

const readFile = promisify(fs.readFile)

interface Template {
  templateName: string
  outputName?: string
}

interface ReadTemplate {
  templateName: string
  content: string
  outputName?: string
}

const inputFiles: { [key: string]: Template } = {
  VUE_DEFAULT_TEMPLATE: {
    templateName: "vue.template.hbs",
  },
  VUE_DEFAULT_SCRIPT: {
    templateName: "vue.script.hbs",
  },
  AUTO_ROUTES: {
    templateName: "vue.routes.js.hbs",
    outputName: "auto-routes.js",
  },
  AUTO_ROUTES_TYPINGS: {
    templateName: "vue.routes.d.ts.hbs",
    outputName: "auto-routes.d.ts",
  },
  AUTO_POSTS: {
    templateName: "vue.posts.js.hbs",
    outputName: "auto-posts.js",
  },
  AUTO_POSTS_TYPINGS: {
    templateName: "vue.posts.d.ts.hbs",
    outputName: "auto-posts.d.ts",
  },
}

const templates: { [key: string]: ReadTemplate } = {}

async function readTemplate(templateName: string): Promise<string> {
  console.log(path.resolve(__dirname, "../../../", "src", "templates", templateName))
  const dir = path.resolve(__dirname, "../../../", "src", "templates", templateName)
  return readFile(dir, { encoding: "utf8" })
}

async function readAllTemplates() {
  const entries = Object.entries(inputFiles).map(async it => {
    const key = it["0"]
    const templateName = it["1"].templateName
    const outputName = it["1"].outputName
    const content = await readTemplate(templateName)
    return {
      key,
      templateName,
      content,
      outputName,
    }
  })
  return Promise.all(entries)
}

readAllTemplates().then(entries => {
  entries.forEach(it => {
    templates[it.key] = {
      templateName: it.templateName,
      content: it.content,
      outputName: it.outputName,
    }
  })
})

export default templates
