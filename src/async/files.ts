import * as fs from "fs"
import * as path from "path"
import { promisify } from "util"

const ENOENT = "ENOENT"
const sep = "/"
const mkdir = promisify(fs.mkdir)
const stat = promisify(fs.stat)
const exists = promisify(fs.exists)
const readDir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)

interface DirectoryInfo {
  directories: string[]
  files: string[]
}

/**
 * Create parent directories if needed
 *
 * @param dir the directory to create, including parent folders
 * @param mode permission mode, defaults to 777 if not provided
 */
async function mkdirp(dir: string, mode = 0o777) {
  try {
    await mkdir(dir, mode)
  } catch (err) {
    switch (err.code) {
      case ENOENT:
        await mkdirp(path.dirname(dir), mode)
        await mkdirp(dir, mode)
        break
      default:
        const stats = await stat(dir)
        if (!stats.isDirectory()) {
          throw err
        }
        break
    }
  }
}

/**
 * Reads directory recursively to get a list of all files and all folders in the directory
 *
 * @param startPath the directory to start reading from
 */
async function listDir(startPath: string): Promise<DirectoryInfo> {
  if (!exists(startPath)) {
    throw new Error(`directory ${startPath} does not exist!`)
  }
  const directories: string[] = []
  const files: string[] = []

  const readdirr = async (root: string): Promise<DirectoryInfo> => {
    const items = await readDir(root)
    for (const item of items) {
      const filePath = path.join(root, item)
      const stats = await stat(filePath)
      if (stats.isDirectory()) {
        directories.push(filePath)
        await readdirr(filePath)
      } else {
        files.push(filePath)
      }
    }
    return {
      directories,
      files,
    }
  }
  return readdirr(startPath)
}

/**
 * Replaces the prefix-path of a directory path with a new prefix-string
 * (changes parent directory from old parent to new parent)
 *
 * @param dir the directory path to replace from old to new
 * @param oldParent the old parent prefix-path to be removed
 * @param newParent the new parent prefix-path to use
 */
function replaceDir(dir: string, oldParent: string, newParent: string): string {
  return dir.replace(
    oldParent.endsWith(sep) ? oldParent.substring(0, oldParent.length - 1) : oldParent,
    newParent.endsWith(sep) ? newParent.substring(0, newParent.length - 1) : newParent,
  )
}

export default {
  sep,
  mkdir,
  stat,
  exists,
  readDir,
  readFile,
  mkdirp,
  listDir,
  replaceDir,
}
