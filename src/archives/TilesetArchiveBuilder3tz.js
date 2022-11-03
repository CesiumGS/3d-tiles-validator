/* eslint-disable */
"use strict";

const fs = require("fs");

const JSZip = require("jszip");

const TilesetArchiveBuilder = require("./TilesetArchiveBuilder");
const IndexBuilder = require("./IndexBuilder");

const defined = require("./defined");

/**
 * Implementation of a TilesetArchiveBuilder that creates a
 * 3TZ file.
 */
class TilesetArchiveBuilder3tz extends TilesetArchiveBuilder {
  constructor() {
    super();

    /**
     * The full name of the output file to be created
     *
     * @type {String}
     * @default undefined
     */
    this.fullOutputName = undefined;

    /**
     * The JSZip object
     *
     * @type {Object} // JSZip
     * @default undefined
     */
    this.zip = undefined;

    /**
     * The index builder that will be used to generate
     * the `"@3dtilesIndex1@"` file for the archive.
     */
    this.indexBuilder = new IndexBuilder();
  }

  begin(fullOutputName, overwrite) {
    if (fs.existsSync(fullOutputName)) {
      if (overwrite) {
        fs.unlinkSync(fullOutputName);
      } else {
        throw new Error("File already exists: " + fullOutputName);
      }
    }
    if (defined(this.zip)) {
      throw new Error("Archive already opened");
    }
    this.fullOutputName = fullOutputName;
    this.zip = new JSZip();
  }

  addEntry(key, content) {
    if (!defined(this.zip)) {
      throw new Error("Archive is not opened. Call 'begin' first.");
    }
    // Don't let JSZip generate folders for paths like `folder/file.ext`.
    // The ZIP entries for these folders would mess up our index.
    const fileOptions = {
      createFolders: false,
    };
    this.zip.file(key, content, fileOptions);
    this.indexBuilder.addEntry(key, content.length);
  }

  async end() {
    if (!defined(this.zip)) {
      throw new Error("Archive is not opened. Call 'begin' first.");
    }

    // Create the index data, and add it as the LAST entry of the ZIP
    const indexData = this.indexBuilder.createBuffer();
    this.zip.file("@3dtilesIndex1@", indexData);

    const generateOptions = {
      type: "nodebuffer",
      compression: "STORE",
    };
    await this.zip.generateAsync(generateOptions).then((buffer) => {
      fs.writeFileSync(this.fullOutputName, buffer);
    });
    this.fullOutputName = undefined;
    this.zip = undefined;
  }
}

module.exports = TilesetArchiveBuilder3tz;
