import * as path from "path"
import * as files from "./files"

interface FileInfoOptions {
  extension: string
  replaceDir?: {
    startFrom: string,
    to: string,
  }
}

export default class FileInfo {
  public static of(fullPath: string): FileInfo {

    const periodIndex = fullPath.lastIndexOf(".")
    const lastSep = fullPath.lastIndexOf(path.sep)
    const extension = fullPath.substring(periodIndex + 1)
    const name = fullPath.substring(lastSep + 1, periodIndex)
    const folder = fullPath.substring(0, lastSep)

    return new FileInfo(fullPath, folder, name, extension)
  }

  public readonly fullPath: string
  public readonly folder: string
  public readonly name: string
  public readonly extension: string
  public readonly fileNameWithExt: string

  private constructor(fullPath: string, folder: string, name: string, extension: string) {
    this.fullPath = fullPath
    this.folder = folder
    this.name = name
    this.extension = extension
    this.fileNameWithExt = folder + path.sep + name
  }

  public changeTo(options: FileInfoOptions): FileInfo {
    const extension: string = options.extension || this.extension
    const folder = options.replaceDir
      ? files.replaceDir(this.folder, options.replaceDir.startFrom, options.replaceDir.to)
      : this.folder

    const fullPath = path.join(folder, this.name + "." + extension)

    return new FileInfo(fullPath, folder, this.name, extension)
  }
}
