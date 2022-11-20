import path from "path";

import { ResourceResolver } from "./ResourceResolver";
import { Uris } from "./Uris";

import { TilesetArchive } from "../archives/TilesetArchive";
import { defined } from "../base/defined";

/**
 * Implementation of a `ResourceResolver` based on a `TilesetArchive`
 *
 * @private (Instantiated by the `ResourceResolvers` class)
 */
export class ArchiveResourceResolver implements ResourceResolver {
  private readonly _basePath: string;
  private readonly _archiveFileName: string;
  private readonly _archive: TilesetArchive;

  constructor(basePath: string, archiveFileName: string, archive: any) {
    this._basePath = basePath;
    this._archiveFileName = archiveFileName;
    this._archive = archive;
  }

  resolveUri(uri: string): string {
    const resolved = path.resolve(this._basePath, decodeURIComponent(uri));
    return resolved;
  }

  async resolveData(uri: string): Promise<Buffer | null> {
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
    /*/
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
    //*/
    if (!defined(entry)) {
      return null;
    }
    return entry!;
  }

  async resolveDataPartial(
    uri: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    maxBytes: number
  ): Promise<Buffer | null> {
    return await this.resolveData(uri);
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
