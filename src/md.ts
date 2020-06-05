import * as yaml from "js-yaml"
import * as files from "./files"
import type { FrontmatterMetadata } from "./vue"

const separator = "---"

export interface MarkdownFile {
  rawContent: string
  frontMatter?: FrontmatterMetadata
}

export default async function readMarkdown(filePath: string): Promise<MarkdownFile> {
  const exists = await files.exists(filePath)
  const stats = await files.stat(filePath)

  if (!exists) {
    throw new Error(`File ${filePath} does not exist!`)
  } else if (!stats.isFile()) {
    throw new Error(`${filePath} is not a file!`)
  }

  const file: string = await files.readFile(filePath, { encoding: "utf8" })
  const length = file.length

  // parse front-matter start
  if (file.startsWith(separator)) {
    // deal with new-line
    let firstIndex: number
    if (length > 3 && file[3] === "\n") {
      firstIndex = 4
    } else if (length > 4 && file[3] === "\r" && file[4] === "\n") {
      firstIndex = 5
    } else {
      // tslint:disable-next-line:max-line-length
      throw new Error(
        `Unexpected / invalid start of front-matter detected in ${filePath}. Make sure the front-matter starts with '---' followed by a new-line!`,
      )
    }

    // parse front-matter end
    for (let i = firstIndex; i < length - 2; i++) {
      if (file[i] === "-" && file[i + 1] === "-" && file[i + 2] === "-") {
        // deal with new-line
        let nextIndex: number
        if (length > i + 2 && file[i + 3] === "\n") {
          nextIndex = i + 4
        } else if (length > i + 3 && file[i + 3] === "\r" && file[i + 4] === "\n") {
          nextIndex = i + 5
        } else {
          // tslint:disable-next-line:max-line-length
          throw new Error(
            `Unexpected / invalid end of front-matter detected in ${filePath}. Make sure the front-matter ends with '---' followed by a new line!`,
          )
        }

        const frontMatterContent = file.substring(firstIndex, i)
        const rawContent = file.substring(nextIndex)

        const frontMatter = yaml.safeLoad(frontMatterContent)
        return {
          rawContent,
          frontMatter,
        }
      }
    }
  }
  return {
    rawContent: file,
  }
}
