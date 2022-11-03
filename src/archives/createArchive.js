/* eslint-disable */
"use strict";

const TilesetArchive3dtiles = require("../lib/TilesetArchive3dtiles");
const TilesetArchive3tz = require("../lib/TilesetArchive3tz");
const TilesetArchiveFs = require("../lib/TilesetArchiveFs");

/**
 * Creates a TilesetArchive, based on the given
 * file extension
 *
 * @param {String} extension The extension: '.3tz' or '.3dtiles'
 * or the empty string (for a directory)
 * @returns The TilesetArchive, or `undefined` if the extension
 * is invalid
 */
function createArchive(extension) {
  if (extension === ".3tz") {
    return new TilesetArchive3tz();
  }
  if (extension === ".3dtiles") {
    return new TilesetArchive3dtiles();
  }
  if (extension === "") {
    return new TilesetArchiveFs();
  }
  console.log("Unknown archive type: " + extension);
  return undefined;
}

module.exports = createArchive;
