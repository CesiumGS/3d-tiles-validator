/**
 * A class describing the options for a validator within
 * a `ValidationContext`
 *
 * Note: Some aspects of this class are preliminary. The exact
 * options and their representation in this class may still
 * change.
 *
 * @beta
 */
export class ValidationOptions {
  /**
   * Whether content data should be validated at all.
   */
  private _validateContentData: boolean;

  /**
   * The validated content types.
   */
  private _validatedContentTypes: string[] | undefined;

  /**
   * Default constructor.
   * 
   * The default options will be:
   * 
   * - `validateContentData = true`, causing content data to be validated
   * - `validatedContentTypes = undefined`, causing ALL known content 
   *    types to be considered in the validation.
   */
  constructor() {
    this._validateContentData = true;
    this._validatedContentTypes = undefined;
  }

  /**
   * The flag that incicates whether content data should
   * be validated at all. When this is `false`, then
   * all content data validations will be skipped.
   */
  get validateContentData(): boolean {
    return this._validateContentData;
  }

  set validateContentData(value: boolean) {
    this._validateContentData = value;
  }

  /**
   * The content types that should be validated.
   *
   * This is an array containing any of the following content
   * type descriptors:
   *
   * - `CONTENT_TYPE_TILESET` (for external tilesets)
   *
   * - `CONTENT_TYPE_GLB` (for binary glTF only)
   *
   * - `CONTENT_TYPE_GLTF` (for JSON-based glTF)
   *
   * - `CONTENT_TYPE_B3DM`
   *
   * - `CONTENT_TYPE_I3DM`
   *
   * - `CONTENT_TYPE_CMPT`
   *
   * - `CONTENT_TYPE_PNTS`
   *
   * - `CONTENT_TYPE_3TZ` (Experimental support)
   *
   * - `CONTENT_TYPE_GEOM` (Not validated yet)
   *
   * - `CONTENT_TYPE_VCTR` (Not validated yet)
   *
   * - `CONTENT_TYPE_GEOJSON` (Not validated yet)
   *
   * If this is `undefined`, then ALL known content types
   * will be considered. Note that this may mean that
   * encountering certain content types will cause a
   * validation warning when the content type validation
   * is not implemented.
   */
  get validatedContentTypes(): string[] | undefined {
    return this._validatedContentTypes;
  }

  set validatedContentTypes(value: string[] | undefined) {
    this._validatedContentTypes = value;
  }
}
