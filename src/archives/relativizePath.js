/* eslint-disable */
"use strict";

const path = require("path");

/**
 * Relativize the given path against the given directory.
 *
 * This will return the relative portion of the given full path,
 * referring to the directory. The result will be normalized and
 * backslashes (from Windows) will be replaced with slashes.
 *
 * @param {String} directory
 * @param {String} fullPath
 * @returns The relativized path as a string
 */
function relativizePath(directory, fullPath) {
  const relativePath = path
    .normalize(path.relative(directory, fullPath))
    .replace(/\\/g, "/");
  return relativePath;
}

module.exports = relativizePath;
