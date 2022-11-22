import { defined } from "./base/defined";
import { Iterables } from "./base/Iterables";
import { relativizePath } from "./base/relativizePath";

import fs from "fs";
import path from "path";

import { TilesetArchive } from "./TilesetArchive";
import { TilesetArchiveError } from "./TilesetArchiveError";

/**
 * Implementation of a TilesetArchive based on a directory
 * in a file system
 */
export class TilesetArchiveFs implements TilesetArchive {
  /**
   * The full name of the directory that contains the tileset.json file
   */
  private fullInputName: string | undefined;

  /**
   * Default constructor
   */
  constructor() {
    this.fullInputName = undefined;
  }

  open(fullInputName: string) {
    if (defined(this.fullInputName)) {
      throw new TilesetArchiveError("Archive already opened");
    }
    this.fullInputName = fullInputName;
  }

  getKeys() {
    if (!defined(this.fullInputName)) {
      throw new TilesetArchiveError(
        "Archive is not opened. Call 'open' first."
      );
    }
    const files = Iterables.overFiles(this.fullInputName!, true);
    return Iterables.map(files, (file) =>
      relativizePath(this.fullInputName!, file)
    );
  }

  getEntry(key: string) {
    if (!defined(this.fullInputName)) {
      throw new TilesetArchiveError(
        "Archive is not opened. Call 'open' first."
      );
    }
    const fullFileName = path.join(this.fullInputName!, key);
    if (!fs.existsSync(fullFileName)) {
      return undefined;
    }
    const data = fs.readFileSync(fullFileName);
    return data;
  }

  close() {
    if (!defined(this.fullInputName)) {
      throw new TilesetArchiveError(
        "Archive is not opened. Call 'open' first."
      );
    }
    this.fullInputName = undefined;
  }
}
