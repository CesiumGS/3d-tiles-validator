import path from "path";

import { ResourceResolver } from "./ResourceResolver";
import { Uris } from "./Uris";

import { TilesetPackage } from "../packages/TilesetPackage";
import { defined } from "3d-tiles-tools";

/**
 * Implementation of a `ResourceResolver` based on a `TilesetPackage`
 *
 * @internal
 */
export class PackageResourceResolver implements ResourceResolver {
  private readonly _basePath: string;
  private readonly _packageFileName: string;
  private readonly _package: TilesetPackage;

  constructor(basePath: string, packageFileName: string, tilesetPackage: any) {
    this._basePath = basePath;
    this._packageFileName = packageFileName;
    this._package = tilesetPackage;
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
    let packageUri = path.join(this._basePath, uri);
    packageUri = packageUri.replace(/\\/g, "/");
    const entry = this._package.getEntry(packageUri);
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
    const result = new PackageResourceResolver(
      resolved,
      this._packageFileName,
      this._package
    );
    return result;
  }
}
