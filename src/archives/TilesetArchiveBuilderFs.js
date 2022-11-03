/* eslint-disable */
"use strict";

const fs = require("fs");
const path = require("path");

const TilesetArchiveBuilder = require("./TilesetArchiveBuilder");

const defined = require("./defined");

/**
 * Implementation of a TilesetArchiveBuilder that writes into
 * a directory of a file system
 */
class TilesetArchiveBuilderFs extends TilesetArchiveBuilder {
  constructor() {
    super();

    /**
     * The name of the output directory
     *
     * @type {String}
     * @default undefined
     */
    this.fullOutputName = undefined;

    /**
     * Whether output files should be overwritten if they
     * already exist.
     *
     * @type {Boolean}
     * @default false
     */
    this.overwrite = false;
  }

  begin(fullOutputName, overwrite) {
    if (defined(this.fullOutputName)) {
      throw new Error("Archive already opened");
    }
    this.fullOutputName = fullOutputName;
    this.overwrite = overwrite;
    if (!fs.existsSync(fullOutputName)) {
      fs.mkdirSync(fullOutputName, { recursive: true });
    }
  }

  addEntry(key, content) {
    if (!defined(this.fullOutputName)) {
      throw new Error("Archive is not opened. Call 'begin' first.");
    }
    const fullOutputFileName = path.join(this.fullOutputName, key);
    if (fs.existsSync(fullOutputFileName)) {
      if (!this.overwrite) {
        throw new Error("File already exists: " + fullOutputFileName);
      }
    }
    // TODO Check call:
    // TODO Need mkdirSync if sub-path does not exist?
    // TODO Need to unlink if file exists?
    fs.writeFileSync(fullOutputFileName, content);
  }

  async end() {
    if (!defined(this.fullOutputName)) {
      throw new Error("Archive is not opened. Call 'begin' first.");
    }
    this.fullOutputName = undefined;
    this.overwrite = false;
  }
}

module.exports = TilesetArchiveBuilderFs;
