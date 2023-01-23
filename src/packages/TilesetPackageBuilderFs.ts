import { defined } from "./base/defined";

import fs from "fs";
import path from "path";

import { TilesetPackageBuilder } from "./TilesetPackageBuilder";
import { TilesetPackageError } from "./TilesetPackageError";

/**
 * Implementation of a TilesetPackageBuilder that writes into
 * a directory of a file system
 */
export class TilesetPackageBuilderFs implements TilesetPackageBuilder {
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
      throw new TilesetPackageError("Package already opened");
    }
    this.fullOutputName = fullOutputName;
    this.overwrite = overwrite;
    if (!fs.existsSync(fullOutputName)) {
      fs.mkdirSync(fullOutputName, { recursive: true });
    }
  }

  addEntry(key: string, content: Buffer) {
    if (!defined(this.fullOutputName)) {
      throw new TilesetPackageError(
        "Package is not opened. Call 'begin' first."
      );
    }
    const fullOutputFileName = path.join(this.fullOutputName!, key);
    if (fs.existsSync(fullOutputFileName)) {
      if (!this.overwrite) {
        throw new TilesetPackageError(
          "File already exists: " + fullOutputFileName
        );
      }
    }
    // TODO Need to unlink if file exists?
    fs.mkdirSync(path.dirname(fullOutputFileName), { recursive: true });
    fs.writeFileSync(fullOutputFileName, content);
  }

  async end() {
    if (!defined(this.fullOutputName)) {
      throw new TilesetPackageError(
        "Package is not opened. Call 'begin' first."
      );
    }
    this.fullOutputName = undefined;
    this.overwrite = false;
  }
}
