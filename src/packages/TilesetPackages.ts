import { TilesetPackage } from "./TilesetPackage";
import { TilesetPackage3dtiles } from "./TilesetPackage3dtiles";
import { TilesetPackage3tz } from "./TilesetPackage3tz";
import { TilesetPackageFs } from "./TilesetPackageFs";

/**
 * Methods related to tileset packages
 */
export class TilesetPackages {
  /**
   * Creates a TilesetPackage, based on the given
   * file extension
   *
   * @param extension - The extension: '.3tz' or '.3dtiles'
   * or the empty string (for a directory)
   * @returns The TilesetPackage, or `undefined` if the extension
   * is invalid
   */
  static create(extension: string): TilesetPackage | undefined {
    if (extension === ".3tz") {
      return new TilesetPackage3tz();
    }
    if (extension === ".3dtiles") {
      return new TilesetPackage3dtiles();
    }
    if (extension === "") {
      return new TilesetPackageFs();
    }
    console.log("Unknown package type: " + extension);
    return undefined;
  }
}
