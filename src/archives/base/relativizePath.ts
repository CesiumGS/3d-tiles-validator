import path from "path";

/**
 * Relativize the given path against the given directory.
 *
 * This will return the relative portion of the given full path,
 * referring to the directory. The result will be normalized and
 * backslashes (from Windows) will be replaced with slashes.
 *
 * @param directory The directory
 * @param fullPath The full path
 * @returns The relativized path as a string
 */
export function relativizePath(directory: string, fullPath: string): string {
  const relativePath = path
    .normalize(path.relative(directory, fullPath))
    .replace(/\\/g, "/");
  return relativePath;
}
