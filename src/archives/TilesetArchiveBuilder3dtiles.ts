import { defined } from "./base/defined";

import fs from "fs";
import { Database } from "better-sqlite3";
import DatabaseConstructor from "better-sqlite3";

import { TilesetArchiveBuilder } from "./TilesetArchiveBuilder";
import { TilesetArchiveError } from "./TilesetArchiveError";

/**
 * Implementation of a TilesetArchiveBuilder that creates a
 * 3DTILES (SQLITE3 database) file.
 */
export class TilesetArchiveBuilder3dtiles implements TilesetArchiveBuilder {
  /**
   * The database
   */
  private db: Database | undefined;

  /**
   * Default constructor
   */
  constructor() {
    this.db = undefined;
  }

  begin(fullOutputName: string, overwrite: boolean): void {
    if (fs.existsSync(fullOutputName)) {
      if (overwrite) {
        fs.unlinkSync(fullOutputName);
      } else {
        throw new TilesetArchiveError("File already exists: " + fullOutputName);
      }
    }
    if (defined(this.db)) {
      throw new TilesetArchiveError("Archive already opened");
    }
    this.db = new DatabaseConstructor(fullOutputName);
    this.db.prepare("PRAGMA journal_mode=off;").run();
    this.db.prepare("BEGIN").run();
    this.db
      .prepare("CREATE TABLE media (key TEXT PRIMARY KEY, content BLOB)")
      .run();
  }

  addEntry(key: string, content: Buffer): void {
    if (!defined(this.db)) {
      throw new TilesetArchiveError(
        "Archive is not opened. Call 'begin' first."
      );
    }
    const insertion = this.db!.prepare("INSERT INTO media VALUES (?, ?)");
    insertion.run(key, content);
  }

  async end(): Promise<void> {
    if (!defined(this.db)) {
      throw new TilesetArchiveError(
        "Archive is not opened. Call 'begin' first."
      );
    }
    this.db!.prepare("COMMIT").run();
    this.db!.close();
    this.db = undefined;
  }
}
