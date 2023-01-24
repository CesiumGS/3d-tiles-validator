import { defined } from "./base/defined";
import { Iterables } from "./base/Iterables";
import { relativizePath } from "./base/relativizePath";

import fs from "fs";
import path from "path";

import { TilesetPackage } from "./TilesetPackage";
import { TilesetPackageError } from "./TilesetPackageError";

/**
 * Implementation of a TilesetPackage based on a directory
 * in a file system
 */
export class TilesetPackageFs implements TilesetPackage {
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
      throw new TilesetPackageError("Package already opened");
    }
    this.fullInputName = fullInputName;
  }

  getKeys() {
    if (!defined(this.fullInputName)) {
      throw new TilesetPackageError(
        "Package is not opened. Call 'open' first."
      );
    }
    const files = Iterables.overFiles(this.fullInputName!, true);
    return Iterables.map(files, (file) =>
      relativizePath(this.fullInputName!, file)
    );
  }

  getEntry(key: string) {
    if (!defined(this.fullInputName)) {
      throw new TilesetPackageError(
        "Package is not opened. Call 'open' first."
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
      throw new TilesetPackageError(
        "Package is not opened. Call 'open' first."
      );
    }
    this.fullInputName = undefined;
  }
}
