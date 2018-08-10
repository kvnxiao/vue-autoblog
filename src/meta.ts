import { ParsedFile } from "./autoblog"
import format from "./format"

export interface EntryInfo {
  routeInfo: RouteInfo
  postInfo: PostInfo
}

export interface PostInfo {
  description?: string
  date?: string
  title?: string
  categories?: string[]
  tags?: string[]
  path?: string
}

export interface MetaInfo {
  [key: string]: any
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
    return `import ${this.componentName} from "${this.file}";`
  }
}

export function extractMetaInfo(frontMatter?: any): { [key: string]: any } {
  // extract root-level title and place inside meta obj
  const metaInfo = frontMatter.metaInfo || {}
  // prefer to use meta-info's title over default root-level title
  if (frontMatter.title && !metaInfo.title) {
    metaInfo.title = frontMatter.title
  }

  if (frontMatter.style) {
    metaInfo.style = frontMatter.style
  }

  if (frontMatter.layout) {
    metaInfo.layout = frontMatter.layout
  }
  return metaInfo
}

export function parseInfo(entry: ParsedFile, outputFolder: string): EntryInfo {
  const frontMatter = entry.markdown.frontMatter
  const componentName = entry.output.name
  const name = format.pascalToKebab(componentName)

  // get permalink url
  const pathPrefixLength = outputFolder.endsWith("/") ? outputFolder.length - 1 : outputFolder.length
  const permalink = frontMatter.permalink || (entry.output.folder + "/" + name).substring(pathPrefixLength)

  const file = entry.output.fullPath.startsWith("src/")
    ? `@/${entry.output.fullPath.substring(4)}`
    : entry.output.fullPath

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
    postInfo.path = permalink
  }

  return {
    postInfo,
    routeInfo: new RouteInfo(permalink, name, componentName, file),
  }
}
