import { MarkdownEntry } from "./autoblog"
import format from "./format"

export interface PostInfo {
  description?: string
  date?: string
  title?: string
  categories?: string[]
  tags?: string[]
  path?: string
}

export interface EntryInfo {
  routeInfo: RouteInfo
  postInfo: PostInfo
}

export class RouteInfo {
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
    return `import ${this.componentName} from "@/${this.file}";`
  }
}

function createMetaInfo(frontMatter: any): object {
  // extract root-level title and place inside meta obj
  const metaInfo = frontMatter.metaInfo ? frontMatter.metaInfo : {}
  // take meta-info title from default root-level title if it exists
  if (frontMatter.title && !metaInfo.title) {
    metaInfo.title = frontMatter.title
  }
  return metaInfo
}

function createPostInfo(entry: MarkdownEntry): EntryInfo {
  const frontMatter = entry.markdown.frontMatter
  const componentName = entry.fileInfo.name
  const name = format.pascalToKebab(componentName)
  const path = frontMatter.permalink
    ? frontMatter.permalink + "/" + name
    : entry.fileInfo.folder + "/" + name
  const file = entry.fileInfo.fullPath

  // set entry-info up for util.inspect (don't show undefined values)
  const postInfo: PostInfo = {}
  if (frontMatter.categories) {
    postInfo.categories = frontMatter.categories
  }
  if (frontMatter.date) {
    postInfo.date = (frontMatter.date as Date).toISOString()
  }
  if (frontMatter.description) {
    postInfo.description = frontMatter.description
  }
  if (frontMatter.tags) {
    postInfo.tags = frontMatter.tags
  }
  if (frontMatter.title) {
    postInfo.title = frontMatter.title
  }
  if (Object.keys(postInfo).length > 0) {
    postInfo.path = path
  }

  return {
    postInfo,
    routeInfo: new RouteInfo(path, name, componentName, file),
  }
}

export default {
  createMetaInfo,
  createPostInfo,
}
