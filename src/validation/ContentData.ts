import path from "path";

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
  private readonly _magic: string;
  private readonly _data: Buffer;
  private readonly _parsedObject: any;

  constructor(uri: string, data: Buffer, parsedObject: any) {
    this._uri = uri;
    this._extension = path.extname(uri).toLowerCase();
    this._magic = ResourceTypes.getMagic(data);
    this._data = data;
    this._parsedObject = parsedObject;
  }

  get uri(): string {
    return this._uri;
  }

  /**
   * Returns a string that consists of the first 4 bytes
   * of the buffer data (or fewer, if the buffer contains
   * less than 4 bytes)
   */
  get magic(): string {
    return this._magic;
  }

  /**
   * Returns the extension of the file/URI from which
   * the buffer data was read, in lowercase, including
   * the `.` dot.
   */
  get extension(): string {
    return this._extension;
  }

  get data(): Buffer {
    return this._data;
  }

  get parsedObject(): any {
    return this._parsedObject;
  }
}
