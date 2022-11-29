import { TilesetArchiveBuilder } from "./TilesetArchiveBuilder";
import { TilesetArchiveBuilder3dtiles } from "./TilesetArchiveBuilder3dtiles";
import { TilesetArchiveBuilder3tz } from "./TilesetArchiveBuilder3tz";
import { TilesetArchiveBuilderFs } from "./TilesetArchiveBuilderFs";

export class TilesetArchiveBuilders {
  /**
   * Creates a TilesetArchiveBuilder, based on the given
   * file extension
   *
   * @param extension - The extension: '.3tz' or '.3dtiles'
   * or the empty string (for a directory)
   * @returns The TilesetArchiveBuilder, or `undefined` if the
   * extension is invalid
   */
  static create(extension: string): TilesetArchiveBuilder | undefined {
    if (extension === ".3tz") {
      return new TilesetArchiveBuilder3tz();
    }
    if (extension === ".3dtiles") {
      return new TilesetArchiveBuilder3dtiles();
    }
    if (extension === "") {
      return new TilesetArchiveBuilderFs();
    }
    console.log("Unknown archive type: " + extension);
    return undefined;
  }
}
