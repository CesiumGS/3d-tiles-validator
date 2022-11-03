/* eslint-disable */
"use strict";

const fs = require("fs");

const Database = require("better-sqlite3");

const TilesetArchiveBuilder = require("./TilesetArchiveBuilder");

const defined = require("./defined");

/**
 * Implementation of a TilesetArchiveBuilder that creates a
 * 3DTILES (SQLITE3 database) file.
 */
class TilesetArchiveBuilder3dtiles extends TilesetArchiveBuilder {
  constructor() {
    super();

    /**
     * The database
     *
     * @type {Database} // better-sqlite3 Database
     * @default undefined
     */
    this.db = undefined;
  }

  begin(fullOutputName, overwrite) {
    if (fs.existsSync(fullOutputName)) {
      if (overwrite) {
        fs.unlinkSync(fullOutputName);
      } else {
        throw new Error("File already exists: " + fullOutputName);
      }
    }
    if (defined(this.db)) {
      throw new Error("Archive already opened");
    }
    this.db = new Database(fullOutputName);
    this.db.prepare("PRAGMA journal_mode=off;").run();
    this.db.prepare("BEGIN").run();
    this.db
      .prepare("CREATE TABLE media (key TEXT PRIMARY KEY, content BLOB)")
      .run();
  }

  addEntry(key, content) {
    if (!defined(this.db)) {
      throw new Error("Archive is not opened. Call 'begin' first.");
    }
    const insertion = this.db.prepare("INSERT INTO media VALUES (?, ?)");
    insertion.run(key, content);
  }

  async end() {
    if (!defined(this.db)) {
      throw new Error("Archive is not opened. Call 'begin' first.");
    }
    this.db.prepare("COMMIT").run();
    this.db.close();
    this.db = undefined;
  }
}

module.exports = TilesetArchiveBuilder3dtiles;
