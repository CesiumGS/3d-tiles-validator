import { defined } from "./base/defined";

import fs from "fs";
import path from "path";

import { TilesetArchiveBuilder } from "./TilesetArchiveBuilder";
import { TilesetArchiveError } from "./TilesetArchiveError";

/**
 * Implementation of a TilesetArchiveBuilder that writes into
 * a directory of a file system
 */
export class TilesetArchiveBuilderFs implements TilesetArchiveBuilder {
  /**
   * The name of the output directory
   */
  private fullOutputName: string | undefined;

  /**
   * Whether output files should be overwritten if they
   * already exist.
   */
  private overwrite: boolean;

  /**
   * Default constructor
   */
  constructor() {
    this.fullOutputName = undefined;
    this.overwrite = false;
  }

  begin(fullOutputName: string, overwrite: boolean) {
    if (defined(this.fullOutputName)) {
      throw new TilesetArchiveError("Archive already opened");
    }
    this.fullOutputName = fullOutputName;
    this.overwrite = overwrite;
    if (!fs.existsSync(fullOutputName)) {
      fs.mkdirSync(fullOutputName, { recursive: true });
    }
  }

  addEntry(key: string, content: Buffer) {
    if (!defined(this.fullOutputName)) {
      throw new TilesetArchiveError(
        "Archive is not opened. Call 'begin' first."
      );
    }
    const fullOutputFileName = path.join(this.fullOutputName!, key);
    if (fs.existsSync(fullOutputFileName)) {
      if (!this.overwrite) {
        throw new TilesetArchiveError(
          "File already exists: " + fullOutputFileName
        );
      }
    }
    // TODO Check call:
    // TODO Need mkdirSync if sub-path does not exist?
    // TODO Need to unlink if file exists?
    fs.writeFileSync(fullOutputFileName, content);
  }

  async end() {
    if (!defined(this.fullOutputName)) {
      throw new TilesetArchiveError(
        "Archive is not opened. Call 'begin' first."
      );
    }
    this.fullOutputName = undefined;
    this.overwrite = false;
  }
}
