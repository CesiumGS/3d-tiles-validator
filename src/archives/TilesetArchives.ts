import { TilesetArchive } from "./TilesetArchive";
import { TilesetArchive3dtiles } from "./TilesetArchive3dtiles";
import { TilesetArchive3tz } from "./TilesetArchive3tz";
import { TilesetArchiveFs } from "./TilesetArchiveFs";

/**
 * Methods related to tileset archives
 */
export class TilesetArchives {
  /**
   * Creates a TilesetArchive, based on the given
   * file extension
   *
   * @param extension - The extension: '.3tz' or '.3dtiles'
   * or the empty string (for a directory)
   * @returns The TilesetArchive, or `undefined` if the extension
   * is invalid
   */
  static create(extension: string): TilesetArchive | undefined {
    if (extension === ".3tz") {
      return new TilesetArchive3tz();
    }
    if (extension === ".3dtiles") {
      return new TilesetArchive3dtiles();
    }
    if (extension === "") {
      return new TilesetArchiveFs();
    }
    console.log("Unknown archive type: " + extension);
    return undefined;
  }
}
