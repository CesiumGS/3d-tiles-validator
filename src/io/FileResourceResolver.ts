import fs from "fs";
import path from "path";

import { ResourceResolver } from "./ResourceResolver";
import { Uris } from "./Uris";

/**
 * Implementation of a `ResourceResolver` based on a file system.
 *
 * @internal (Instantiated by the `ResourceResolvers` class)
 */
export class FileResourceResolver implements ResourceResolver {
  private readonly _basePath: string;

  constructor(basePath: string) {
    this._basePath = basePath;
  }

  resolveUri(uri: string): string {
    let resolved = path.resolve(this._basePath, decodeURIComponent(uri));
    resolved = resolved.replace(/\\/g, "/");
    return resolved;
  }

  async resolveDataPartial(
    uri: string,
    maxBytes: number
  ): Promise<Buffer | null> {
    if (Uris.isDataUri(uri)) {
      const data = Buffer.from(uri.split(",")[1], "base64");
      return data;
    }
    if (Uris.isAbsoluteUri(uri)) {
      return null;
    }
    const resolved = this.resolveUri(uri);
    try {
      const buffer = Buffer.alloc(maxBytes);
      const fd = fs.openSync(resolved, "r");
      fs.readSync(fd, buffer, 0, maxBytes, 0);
      fs.closeSync(fd);
      return buffer;
    } catch (error) {
      return null;
    }
  }

  async resolveData(uri: string): Promise<Buffer | null> {
    if (Uris.isDataUri(uri)) {
      const data = Buffer.from(uri.split(",")[1], "base64");
      return data;
    }
    if (Uris.isAbsoluteUri(uri)) {
      return null;
    }
    const resolved = this.resolveUri(uri);
    // Using `readFileSync` directly causes a buffer to be returned
    // that will appear to contain garbage data when it is used by
    // the glTF-Validator. If anybody could explain to me why this
    // does not work, that would be great.
    //return fs.readFileSync(resolved);
    //*/
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      fs.readFile(resolved, (err: any, data: Buffer) => {
        if (err) {
          resolve(null);
        } else {
          resolve(data);
        }
      });
    });
    //*/
  }
  derive(uri: string): ResourceResolver {
    const resolved = path.join(this._basePath, decodeURIComponent(uri));
    return new FileResourceResolver(resolved);
  }
}
