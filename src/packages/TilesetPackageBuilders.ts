import { TilesetPackageBuilder } from "./TilesetPackageBuilder";
import { TilesetPackageBuilder3dtiles } from "./TilesetPackageBuilder3dtiles";
import { TilesetPackageBuilder3tz } from "./TilesetPackageBuilder3tz";
import { TilesetPackageBuilderFs } from "./TilesetPackageBuilderFs";

export class TilesetPackageBuilders {
  /**
   * Creates a TilesetPackageBuilder, based on the given
   * file extension
   *
   * @param extension - The extension: '.3tz' or '.3dtiles'
   * or the empty string (for a directory)
   * @returns The TilesetPackageBuilder, or `undefined` if the
   * extension is invalid
   */
  static create(extension: string): TilesetPackageBuilder | undefined {
    if (extension === ".3tz") {
      return new TilesetPackageBuilder3tz();
    }
    if (extension === ".3dtiles") {
      return new TilesetPackageBuilder3dtiles();
    }
    if (extension === "") {
      return new TilesetPackageBuilderFs();
    }
    console.log("Unknown package type: " + extension);
    return undefined;
  }
}
