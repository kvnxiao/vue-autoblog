import * as fs from "fs"
import * as path from "path"

interface DirectoryInfo {
  directories: string[]
  files: string[]
}

interface FileInfoOptions {
  extension: string
  replaceDir?: {
    startFrom: string,
    to: string,
  }
}

export class FileInfo {
  public readonly fullPath: string
  public readonly folder: string
  public readonly name: string
  public readonly extension: string
  public get fileNameWithExtension(): string {
    return path.join(this.folder, this.name)
  }

  constructor(fullPath: string) {
    this.fullPath = fullPath

    const periodIndex = fullPath.lastIndexOf(".")
    const lastSep = fullPath.lastIndexOf(path.sep)
    const fileExtension = fullPath.substring(periodIndex + 1)
    const fileName = fullPath.substring(lastSep + 1, periodIndex)
    const folderPath = fullPath.substring(0, lastSep)

    this.folder = folderPath
    this.extension = fileExtension
    this.name = fileName
  }

  public changeTo(options: FileInfoOptions): FileInfo {
    const extension: string = options.extension || this.extension
    const folderPath = options.replaceDir
      ? replaceDir(this.folder, options.replaceDir.startFrom, options.replaceDir.to)
      : this.folder

    return new FileInfo(path.join(folderPath, this.name + "." + extension))
  }
}

/**
 * Create parent directories if needed.
 *
 * @param dir the directory to create with parents
 */
function mkdirp(dir: string): boolean {
  const split = dir.split(path.sep)

  // clean trailing "/"
  if (split[split.length - 1] === path.sep) {
    split.pop()
  }

  let currPath = ""
  for (const p of split) {
    currPath = path.join(currPath, p)
    try {
      fs.mkdirSync(currPath)
    } catch (err) {
      if (err.errno !== -17) {
        console.error(err)
        return false
      }
    }
  }
  return true
}

/**
 * Reads directory recursively to get a list of all files and all folders in the directory.
 *
 * @param currDir the current directory
 * @param fileExtLowerCase the file extension to match (filter in), in lowercase
 */
function listDirectory(currDir: string, fileExtLowerCase: string): DirectoryInfo {
  const allFiles: DirectoryInfo = {
    directories: [],
    files: [],
  }

  const files = fs.readdirSync(currDir).map(fileName => path.join(currDir, fileName))
  files.forEach((filePath) => {
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      allFiles.directories.push(filePath)
      allFiles.files = allFiles.files.concat(listDirectory(filePath, fileExtLowerCase).files)
    } else {
      if (filePath.toLowerCase().endsWith(fileExtLowerCase)) {
        allFiles.files.push(filePath)
      }
    }
  })
  return allFiles
}

/**
 * Recurisvely deletes a file or directory.
 *
 * @param dirPath file or folder to delete
 */
function deleteDirectory(dirPath: string) {
  if (dirPath === "/") {
    return
  }

  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file: string) => {
      const currPath = path.join(dirPath, file)
      if (fs.lstatSync(currPath).isDirectory()) {
        deleteDirectory(currPath)
      } else {
        fs.unlinkSync(currPath)
      }
    })
    fs.rmdirSync(dirPath)
  }
}

function replaceDir(dir: string, oldParent: string, newParent: string): string {
  return dir.replace(
    oldParent.endsWith(path.sep) ? oldParent.substring(0, oldParent.length - 1) : oldParent,
    newParent.endsWith(path.sep) ? newParent.substring(0, newParent.length - 1) : newParent,
  )
}

export default {
  deleteDirectory,
  listDirectory,
  mkdirp,
  replaceDir,
}
