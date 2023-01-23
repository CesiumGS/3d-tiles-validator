import { defined } from "./base/defined";

import { Database } from "better-sqlite3";
import DatabaseConstructor from "better-sqlite3";

import { TilesetPackage } from "./TilesetPackage";
import { TilesetPackageError } from "./TilesetPackageError";
import { Iterables } from "./base/Iterables";

/**
 * Implementation of a TilesetPackage based on a 3DTILES (SQLITE3 database)
 * file.
 */
export class TilesetPackage3dtiles implements TilesetPackage {
  /**
   * The database, or undefined if the database is not opened
   */
  private db: Database | undefined;

  /**
   * Default constructor
   */
  constructor() {
    this.db = undefined;
  }

  open(fullInputName: string): void {
    if (defined(this.db)) {
      throw new TilesetPackageError("Database already opened");
    }
    this.db = new DatabaseConstructor(fullInputName);
  }

  getKeys(): IterableIterator<string> {
    if (!defined(this.db)) {
      throw new TilesetPackageError(
        "Package is not opened. Call 'open' first."
      );
    }
    const selection = this.db!.prepare("SELECT * FROM media");
    const iterator = selection.iterate();
    return Iterables.map(iterator, (row) => row.key);
  }

  getEntry(key: string): Buffer | undefined {
    if (!defined(this.db)) {
      throw new Error("Package is not opened. Call 'open' first.");
    }
    const selection = this.db!.prepare("SELECT * FROM media WHERE key = ?");
    const row = selection.get(key);
    if (defined(row)) {
      return row.content;
    }
    return undefined;
  }

  close() {
    if (!defined(this.db)) {
      throw new Error("Package is not opened. Call 'open' first.");
    }
    this.db!.close();
    this.db = undefined;
  }
}
