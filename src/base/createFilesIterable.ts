"use strict";

import fs from "fs";
import path from "path";

import { PathLike } from "fs";

/**
 * Creates a generator that allows iterating over all files
 * in the given directory, and its subdirectories if
 * `recurse` is `true`.
 *
 * @param {string | fs.PathLike} directory The directory
 * @param {boolean} recurse [true] Whether the files should
 * be listed recursively
 * @return The generator for path strings
 */
export function* createFilesIterable(
  directory: string | PathLike,
  recurse: boolean = true
): IterableIterator<string> {
  const fileNames = fs.readdirSync(directory);
  for (const fileName of fileNames) {
    const fullPath = path.join(directory.toString(), fileName);
    const isDirectory = fs.statSync(fullPath).isDirectory();
    if (isDirectory && recurse) {
      yield* createFilesIterable(fullPath);
    } else if (!isDirectory) {
      yield fullPath;
    }
  }
}

