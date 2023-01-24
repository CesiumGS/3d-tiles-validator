import { defined } from "./base/defined";

import fs from "fs";
import archiver from "archiver";

import { TilesetPackageBuilder } from "./TilesetPackageBuilder";
import { IndexBuilder } from "./IndexBuilder";
import { TilesetPackageError } from "./TilesetPackageError";

/**
 * Implementation of a TilesetPackageBuilder that creates a
 * 3TZ file.
 */
export class TilesetPackageBuilder3tz implements TilesetPackageBuilder {
  /**
   * The stream that the data is written to
   */
  private outputStream: fs.WriteStream | undefined;

  /**
   * The archive object
   */
  private archive: archiver.Archiver | undefined;

  /**
   * The index builder that will be used to generate
   * the `"@3dtilesIndex1@"` file for the package.
   */
  private readonly indexBuilder;

  /**
   * Default constructor
   */
  constructor() {
    this.outputStream = undefined;
    this.archive = undefined;
    this.indexBuilder = new IndexBuilder();
  }

  begin(fullOutputName: string, overwrite: boolean) {
    if (fs.existsSync(fullOutputName)) {
      if (overwrite) {
        fs.unlinkSync(fullOutputName);
      } else {
        throw new TilesetPackageError("File already exists: " + fullOutputName);
      }
    }
    if (defined(this.archive)) {
      throw new TilesetPackageError("Package already opened");
    }
    this.outputStream = fs.createWriteStream(fullOutputName);
    this.archive = archiver("zip", {
      store: true,
    });
    this.archive.pipe(this.outputStream);

    // Logging and error handling for archiver:
    this.archive.on("warning", (error) => {
      throw new TilesetPackageError(`${error}`);
    });
    this.archive.on("error", (error) => {
      throw new TilesetPackageError(`${error}`);
    });
  }

  addEntry(key: string, content: Buffer) {
    if (!defined(this.archive)) {
      throw new TilesetPackageError(
        "Package is not opened. Call 'begin' first."
      );
    }
    this.archive!.append(content, { name: key });
    this.indexBuilder.addEntry(key, content.length);
  }

  async end() {
    if (!defined(this.archive)) {
      throw new TilesetPackageError(
        "Package is not opened. Call 'begin' first."
      );
    }

    // Create the index data, and add it as the LAST entry of the ZIP
    const indexData = this.indexBuilder.createBuffer();
    this.archive!.append(indexData, { name: "@3dtilesIndex1@" });

    await this.archive!.finalize();
    this.outputStream = undefined;
    this.archive = undefined;
  }
}
