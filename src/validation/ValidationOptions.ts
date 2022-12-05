/**
 * A class describing the options for a validator within
 * a `ValidationContext`
 *
 * TODO This is preliminary. The exact options will have to
 * be sorted out as we go. For example, there could be flags
 * - validateExternalResources
 * - validateAbsoluteUris...?
 * - validateContentData
 * - validateContentTypes = [GLB, B3DM]
 * - validateExternalTilesets
 * - validateExternalSchema
 * - ...
 * The check at the call site could and should HIDE most of
 * these, and boil down to `options.shouldValidate(uri)`.
 */
export class ValidationOptions {
  private _validateContentData: boolean;

  constructor() {
    this._validateContentData = true;
  }

  get validateContentData(): boolean {
    return this._validateContentData;
  }

  set validateContentData(value: boolean) {
    this._validateContentData = value;
  }
}
