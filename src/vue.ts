import * as moment from "moment"
import * as path from "path"
import { ParsedFile } from "./autoblog"
import FileInfo from "./file"
import format from "./format"

export interface ParsedVueFile {
  html: string
  output: FileInfo
  metadata: Metadata
  routeEntry: RouteEntry
}

interface Author {
  firstName: string
  lastName: string
}

export interface Metadata {
  title?: string
  metaInfo?: VueMetaInfo
  style?: string
  layout?: string
  isComponent: boolean

  // post info
  id: string
  permalink: string
  description?: string
  date?: Date
  categories?: string[]
  tags?: string[]
  author?: Author
  dateFormatted?: string

  // extra info
  extra?: unknown
}

export interface FrontmatterMetadata {
  title?: string
  metaInfo?: VueMetaInfo
  style?: string
  layout?: string
  isComponent: boolean

  // post info
  id: string
  permalink: string
  description?: string
  date?: Date
  categories?: string[]
  tags?: string[]
  author?: Author
  dateFormat?: string
  dateFormatted?: string

  // extra info
  extra?: unknown
}

export interface PostEntry {
  title?: string
  id: string
  permalink: string
  description?: string
  date?: string
  categories?: string[]
  tags?: string[]
}

export interface VueMetaInfo {
  title?: string
  titleTemplate?: string
  htmlAttrs?: Record<string, unknown>
  bodyAttrs?: Record<string, unknown>
  base?: Record<string, unknown>
  meta?: Record<string, unknown>[]
  link?: Record<string, unknown>[]
  style?: Record<string, unknown>[]
  script?: Record<string, unknown>[]
  noscript?: Record<string, unknown>[]
}

export class RouteEntry {
  public readonly path: string
  public readonly name: string
  public readonly componentName: string
  public readonly file: string

  constructor(path: string, name: string, componentName: string, file: string) {
    this.path = path
    this.name = name
    this.componentName = componentName
    this.file = file
  }

  public toString(): string {
    return `{ path: "${this.path}", name: "${this.name}", component: ${this.componentName} }`
  }

  public getImport(): string {
    return `import ${this.componentName} from "${this.file}";`
  }

  public getLazyImport(): string {
    return `const ${this.componentName} = () => import(/* webpackChunkName: "${this.name}" */ "${this.file}");`
  }
}

function extractMetadata(
  id: string,
  outputFolder: string,
  rootOutputFolder: string,
  frontMatter?: FrontmatterMetadata,
): Metadata {
  const metadata: Metadata = {
    id,
    isComponent: frontMatter?.isComponent ?? false,
    permalink: getPermalink(id, outputFolder, rootOutputFolder, frontMatter ? frontMatter.permalink : undefined),
  }
  if (frontMatter) {
    // set vue-meta's meta-info
    if (frontMatter.metaInfo) {
      metadata.metaInfo = frontMatter.metaInfo
    }
    // set post specific style, if it exists
    if (frontMatter.style !== undefined) {
      metadata.style = frontMatter.style
    }
    // set post specific layout, if it exists
    if (frontMatter.layout) {
      metadata.layout = frontMatter.layout
    }
    // set post title
    if (frontMatter.title) {
      // prefer to use vue-meta's meta-info title over "root-level frontMatter title"
      if (metadata.metaInfo && metadata.metaInfo.title) {
        metadata.title = metadata.metaInfo.title
      } else {
        metadata.title = frontMatter.title
      }
    }

    // post info stuff
    if (frontMatter.description) {
      metadata.description = frontMatter.description
    }
    if (frontMatter.date) {
      metadata.date = frontMatter.date
    }
    if (frontMatter.categories) {
      metadata.categories = frontMatter.categories
    }
    if (frontMatter.tags) {
      metadata.tags = frontMatter.tags
    }
    if (frontMatter.author) {
      metadata.author = frontMatter.author
    }

    // date formatting
    if (frontMatter.date && frontMatter.dateFormat) {
      const dateFormat: string = frontMatter.dateFormat as string
      metadata.dateFormatted = moment(frontMatter.date).format(dateFormat)
    }

    // extra info
    if (frontMatter.extra) {
      metadata.extra = frontMatter.extra
    }
  }
  return metadata
}

function getPermalink(
  id: string,
  outputFolder: string,
  rootOutputFolder: string,
  frontMatterPermalink?: string,
): string {
  const nout = path.normalize(outputFolder)
  const nrootOut = path.normalize(rootOutputFolder)
  const pathPrefixLength = nrootOut.endsWith(path.sep) ? nrootOut.length - 1 : nrootOut.length
  const permalink = (frontMatterPermalink || (nout + path.sep + id).substring(pathPrefixLength)).replace(/\\/g, "/")
  return permalink
}

export function parse(parsedFile: ParsedFile, rootOutputFolder: string): ParsedVueFile {
  const componentName = parsedFile.output.name
  const metadata = extractMetadata(
    format.pascalToKebab(componentName),
    parsedFile.output.folder,
    rootOutputFolder,
    parsedFile.markdown.frontMatter,
  )

  const srcPrefix = path.join("src", path.sep)
  const filePath = (parsedFile.output.fullPath.startsWith(srcPrefix)
    ? `@/${parsedFile.output.fullPath.substring(srcPrefix.length)}`
    : parsedFile.output.fullPath
  ).replace(/\\/g, "/")

  const routeEntry = new RouteEntry(metadata.permalink, metadata.id, componentName, filePath)

  return {
    metadata,
    routeEntry,
    output: parsedFile.output,
    html: parsedFile.html,
  }
}
