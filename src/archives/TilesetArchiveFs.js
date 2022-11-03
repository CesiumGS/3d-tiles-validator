/* eslint-disable */
"use strict";

const fs = require("fs");
const path = require("path");

const TilesetArchive = require("./TilesetArchive");

const defined = require("./defined");
const mapIterable = require("./mapIterable");
const createFilesIterable = require("./createFilesIterable");
const relativizePath = require("./relativizePath");

/**
 * Implementation of a TilesetArchive based on a directory
 * in a file system
 */
class TilesetArchiveFs extends TilesetArchive {
  constructor() {
    super();

    /**
     * The full name of the directory that contains the tileset.json file
     *
     * @type {String}
     * @default undefined
     */
    this.fullInputName = undefined;
  }

  open(fullInputName) {
    if (defined(this.fullInputName)) {
      throw new Error("Archive already opened");
    }
    this.fullInputName = fullInputName;
  }

  getKeys() {
    if (!defined(this.fullInputName)) {
      throw new Error("Archive is not opened. Call 'open' first.");
    }
    const files = createFilesIterable(this.fullInputName);
    return mapIterable(files, (file) =>
      relativizePath(this.fullInputName, file)
    );
  }

  getEntry(key) {
    if (!defined(this.fullInputName)) {
      throw new Error("Archive is not opened. Call 'open' first.");
    }
    const fullFileName = path.join(this.fullInputName, key);
    if (!fs.existsSync(fullFileName)) {
      return undefined;
    }
    const data = fs.readFileSync(fullFileName);
    return data;
  }

  close() {
    if (!defined(this.fullInputName)) {
      throw new Error("Archive is not opened. Call 'open' first.");
    }
    this.fullInputName = undefined;
  }
}

module.exports = TilesetArchiveFs;
