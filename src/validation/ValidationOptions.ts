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
   * The content types that are included in the validation.
   */
  private _includeContentTypes: string[] | undefined;

  /**
   * The content types that are included in the validation.
   */
  private _excludeContentTypes: string[] | undefined;

  /**
   * Default constructor.
   *
   * The default options will be:
   *
   * - `validateContentData = true`, causing content data to be validated
   * - `includeContentTypes = undefined`, causing ALL known content
   *    types to be included in the validation.
   * - `excludeContentTypes = undefined`, causing NO known content
   *    types to be excluded the validation.
   */
  constructor() {
    this._validateContentData = true;
    this._includeContentTypes = undefined;
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
   * The content types that should be included.
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
   * will be included. Note that this may mean that
   * encountering certain content types will cause a
   * validation warning when the content type validation
   * is not implemented.
   */
  get includeContentTypes(): string[] | undefined {
    return this._includeContentTypes;
  }

  set includeContentTypes(value: string[] | undefined) {
    this._includeContentTypes = value;
  }

  /**
   * The content types that should be excluded.
   *
   * See `includeContentTypes` for details.
   *
   * If this is `undefined`, then NO known content type
   * will be excluded.
   */
  get excludeContentTypes(): string[] | undefined {
    return this._excludeContentTypes;
  }

  set excludeContentTypes(value: string[] | undefined) {
    this._excludeContentTypes = value;
  }

  /**
   * Creates a new `ValidationOptions` object where each property is
   * initialized from the given JSON object.
   *
   * @param json - The input JSON object
   * @returns The validation options
   */
  static fromJson(json: any): ValidationOptions {
    const options: ValidationOptions = Object.assign(
      new ValidationOptions(),
      json
    );
    return options;
  }
}
