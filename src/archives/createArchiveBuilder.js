/* eslint-disable */
"use strict";

const TilesetArchiveBuilder3dtiles = require("../lib/TilesetArchiveBuilder3dtiles");
const TilesetArchiveBuilder3tz = require("../lib/TilesetArchiveBuilder3tz");
const TilesetArchiveBuilderFs = require("../lib/TilesetArchiveBuilderFs");

/**
 * Creates a TilesetArchiveBuilder, based on the given
 * file extension
 *
 * @param {String} extension The extension: '.3tz' or '.3dtiles'
 * or the empty string (for a directory)
 * @returns The TilesetArchiveBuilder, or `undefined` if the
 * extension is invalid
 */
function createArchiveBuilder(extension) {
  if (extension === ".3tz") {
    return new TilesetArchiveBuilder3tz();
  }
  if (extension === ".3dtiles") {
    return new TilesetArchiveBuilder3dtiles();
  }
  if (extension === "") {
    return new TilesetArchiveBuilderFs();
  }
  console.log("Unknown archive type: " + extension);
  return undefined;
}

module.exports = createArchiveBuilder;
