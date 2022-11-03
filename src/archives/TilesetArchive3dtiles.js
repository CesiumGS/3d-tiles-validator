/* eslint-disable */
"use strict";

const TilesetArchive = require("./TilesetArchive");

const Database = require("better-sqlite3");

const defined = require("./defined");
const mapIterable = require("./mapIterable");

/**
 * Implementation of a TilesetArchive based on a 3DTILES (SQLITE3 database)
 * file.
 */
class TilesetArchive3dtiles extends TilesetArchive {
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

  open(fullInputName) {
    if (defined(this.db)) {
      throw new Error("Database already opened");
    }
    this.db = new Database(fullInputName);
  }

  getKeys() {
    if (!defined(this.db)) {
      throw new Error("Archive is not opened. Call 'open' first.");
    }
    const selection = this.db.prepare("SELECT * FROM media");
    const iterator = selection.iterate();
    return mapIterable(iterator, (row) => row.key);
  }

  getEntry(key) {
    if (!defined(this.db)) {
      throw new Error("Archive is not opened. Call 'open' first.");
    }
    const selection = this.db.prepare("SELECT * FROM media WHERE key = ?");
    const row = selection.get(key);
    if (defined(row)) {
      return row.content;
    }
    return undefined;
  }

  close() {
    if (!defined(this.db)) {
      throw new Error("Archive is not opened. Call 'open' first.");
    }
    this.db.close();
    this.db = undefined;
  }
}

module.exports = TilesetArchive3dtiles;
