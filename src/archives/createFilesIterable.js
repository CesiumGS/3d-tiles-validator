/* eslint-disable */
"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Creates a generator that allows iterating over all files
 * in the given directory and its subdirectories
 *
 * @param {fs.PathLike} directory The directory
 * @return The generator for 'path' objects
 */
function* createFilesIterable(directory) {
  const fileNames = fs.readdirSync(directory);
  for (const fileName of fileNames) {
    const fullPath = path.join(directory, fileName);
    if (fs.statSync(fullPath).isDirectory()) {
      yield* createFilesIterable(fullPath);
    } else {
      yield fullPath;
    }
  }
}

module.exports = createFilesIterable;
