import { defined } from "./base/defined";

import fs from "fs";

import { IndexEntry } from "./IndexEntry";
import { TilesetArchive } from "./TilesetArchive";
import { TilesetArchiveError } from "./TilesetArchiveError";
import { ArchiveFunctions3tz } from "./ArchiveFunctions3tz";

/**
 * Implementation of a TilesetArchive based on a 3TZ file.
 */
export class TilesetArchive3tz implements TilesetArchive {
  /**
   * The file descriptor that was created from the input file
   */
  private fd: number | undefined;

  /**
   * The ZIP index.
   *
   * This is created from the `"@3dtilesIndex1@"` file of an archive.
   *
   * It is an array if `IndexEntry` objects, sorted by the MD5 hash,
   * in ascending order.
   */
  private zipIndex: IndexEntry[] | undefined;

  /**
   * Default constructor
   */
  constructor() {
    this.fd = undefined;
    this.zipIndex = undefined;
  }

  getZipIndex(): IndexEntry[] | undefined {
    return this.zipIndex;
  }

  open(fullInputName: string) {
    if (defined(this.fd)) {
      throw new TilesetArchiveError("Archive already opened");
    }

    this.fd = fs.openSync(fullInputName, "r");
    this.zipIndex = ArchiveFunctions3tz.readZipIndex(this.fd);
  }

  getKeys(): IterableIterator<string> {
    if (!defined(this.fd)) {
      throw new TilesetArchiveError(
        "Archive is not opened. Call 'open' first."
      );
    }
    let index = 0;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next(): IteratorResult<string, any> {
        if (index >= that.zipIndex!.length) {
          return { value: undefined, done: true };
        }
        const entry = that.zipIndex![index];
        const offset = entry.offset;
        const fileName = ArchiveFunctions3tz.readFileName(that.fd!, offset);
        const result = {
          value: fileName,
          done: false,
        };
        index++;
        return result;
      },
    };
  }

  getEntry(key: string) {
    if (!defined(this.fd)) {
      throw new TilesetArchiveError(
        "Archive is not opened. Call 'open' first."
      );
    }
    const entryData = ArchiveFunctions3tz.readEntryData(
      this.fd!,
      this.zipIndex!,
      key
    );
    return entryData;
  }

  close() {
    if (!defined(this.fd)) {
      throw new TilesetArchiveError(
        "Archive is not opened. Call 'open' first."
      );
    }
    fs.closeSync(this.fd!);

    this.fd = undefined;
    this.zipIndex = undefined;
  }
}
