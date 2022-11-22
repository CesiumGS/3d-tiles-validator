import path from "path";

import { defined } from "../base/defined";

import { ResourceResolver } from "../io/ResourceResolver";
import { ResourceTypes } from "../io/ResourceTypes";

/**
 * A class summarizing information about content data.
 *
 * This is only used in the `ContentDataValidator` and
 * `ContentDataValidators` classes, to facilitate the
 * lookup up validators for given content data, based
 * on criteria like the file extension or magic header.
 *
 * @private
 */
export class ContentData {
  private readonly _uri: string;
  private readonly _extension: string;
  private readonly _resourceResolver: ResourceResolver;

  private _magic: string | undefined;

  private _data: Buffer | null;
  private _dataWasRequested: boolean;

  constructor(uri: string, resourceResolver: ResourceResolver) {
    this._uri = uri;
    this._resourceResolver = resourceResolver;
    this._extension = path.extname(uri).toLowerCase();
    this._magic = undefined;
    this._data = null;
    this._dataWasRequested = false;
  }

  get uri(): string {
    return this._uri;
  }

  /**
   * Returns the extension of the file/URI from which
   * the buffer data was read, in lowercase, including
   * the `.` dot.
   */
  get extension(): string {
    return this._extension;
  }

  /**
   * Returns a string that consists of the first 4 bytes
   * of the buffer data (or fewer, if the buffer contains
   * less than 4 bytes)
   */
  async getMagic(): Promise<string> {
    if (defined(this._magic)) {
      return this._magic!;
    }
    const partialData = await this._resourceResolver.resolveDataPartial(
      this._uri,
      4
    );
    if (defined(partialData)) {
      this._magic = ResourceTypes.getMagic(partialData!);
    } else {
      this._magic = "";
    }
    return this._magic;
  }

  async getData(): Promise<Buffer | null> {
    if (this._dataWasRequested) {
      return this._data;
    }
    this._data = await this._resourceResolver.resolveData(this._uri);
    this._dataWasRequested = true;
    return this._data;
  }
}
