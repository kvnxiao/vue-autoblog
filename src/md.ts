import * as fs from "fs"
import * as yaml from "js-yaml"
import * as markdownit from "markdown-it"
import config from "./config"

const separator = "---"
const md = new markdownit(config.markdownit)

export class MarkdownFile {
  public readonly frontMatter?: any
  public readonly rawContent: string

  constructor(rawContent: string, frontMatter?: any) {
    this.rawContent = rawContent
    this.frontMatter = frontMatter
  }

  public parseToHTML(): string {
    return md.render(this.rawContent)
  }
}

function readMd(filePath: string): MarkdownFile {
  const exists = fs.existsSync(filePath)
  const stats = fs.statSync(filePath)
  if (!exists) {
    throw new Error(`File ${filePath} does not exist!`)
  } else if (!stats.isFile()) {
    throw new Error(`${filePath} is not a file!`)
  }

  const file = fs.readFileSync(filePath, "utf8")
  const length = file.length

  // parse front-matter start
  if (file.startsWith(separator)) {
    // deal with new-line
    let firstIndex: number
    if (length > 3 && file[3] === "\n") {
      firstIndex = 4
    } else if (length > 4
        && file[3] === "\r" && file[4] === "\n") {
      firstIndex = 5
    } else {
      // tslint:disable-next-line:max-line-length
      throw new Error(`Unexpected / invalid start of front-matter detected in ${filePath}. Make sure the front-matter starts with '---' followed by a new-line!`)
    }

    // parse front-matter end
    for (let i = firstIndex; i < length - 2; i++) {
      if (file[i] === "-" && file[i + 1] === "-" && file[i + 2] === "-") {
        // deal with new-line
        let nextIndex: number
        if (length > (i + 2) && file[i + 3] === "\n") {
          nextIndex = i + 4
        } else if (length > (i + 3) && file[i + 3] === "\r" && file[i + 4] === "\n") {
          nextIndex = i + 5
        } else {
          // tslint:disable-next-line:max-line-length
          throw new Error(`Unexpected / invalid end of front-matter detected in ${filePath}. Make sure the front-matter ends with '---' followed by a new line!`)
        }

        const frontMatterContent = file.substring(firstIndex, i)
        const rawContent = file.substring(nextIndex)

        const frontMatter = yaml.safeLoad(frontMatterContent)
        return new MarkdownFile(rawContent, frontMatter)
      }
    }
  }
  return new MarkdownFile(file)
}

export default {
  readMd,
}
