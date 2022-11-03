import path from "path";

import { defined } from "../base/defined";

import { ResourceResolver } from "./ResourceResolver";
import { Uris } from "./Uris";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TilesetArchive3tz = require("../archives/TilesetArchive3tz");

/**
 * Implementation of a `ResourceResolver` based on a `TilesetArchive`
 *
 * @private (Instantiated by the `ResourceResolvers` class)
 */
export class ArchiveResourceResolver implements ResourceResolver {
  private readonly _basePath: string;
  private readonly _archiveFileName: string;
  private readonly _archive: typeof TilesetArchive3tz;

  // TODO_ARCHIVE_EXPERIMENTS
  resolveUri(uri: string): string {
    const resolved = path.resolve(this._basePath, decodeURIComponent(uri));
    return resolved;
  }

  constructor(basePath: string, archiveFileName: string, archive: any) {
    this._basePath = basePath;
    this._archiveFileName = archiveFileName;
    if (defined(archive)) {
      this._archive = archive;
    } else {
      this._archive = new TilesetArchive3tz();
      this._archive.open(archiveFileName);
    }
  }

  async resolve(uri: string): Promise<Buffer | null> {
    if (Uris.isDataUri(uri)) {
      const data = Buffer.from(uri.split(",")[1], "base64");
      return data;
    }
    if (Uris.isAbsoluteUri(uri)) {
      return null;
    }
    let archiveUri = path.join(this._basePath, uri);
    archiveUri = archiveUri.replace(/\\/g, "/");
    const entry = this._archive.getEntry(archiveUri);
    // TODO Log message for experiment:
    console.log(
      "Resolving " +
        uri +
        " resolved to  " +
        archiveUri +
        " from archive " +
        this._archiveFileName +
        " returns " +
        (defined(entry) ? entry.length + " bytes" : "undefined")
    );
    return entry;
  }
  derive(uri: string): ResourceResolver {
    let resolved = path.join(this._basePath, decodeURIComponent(uri));
    resolved = resolved.replace(/\\/g, "/");
    const result = new ArchiveResourceResolver(
      resolved,
      this._archiveFileName,
      this._archive
    );
    return result;
  }
}
