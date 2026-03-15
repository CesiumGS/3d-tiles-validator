import { ValidationIssueSeverity } from "./ValidationIssueSeverity";

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
   * The severity of content validation issues that should be
   * included in the results.
   */
  private _contentValidationIssueSeverity: ValidationIssueSeverity;

  /**
   * The content types that are included in the validation.
   */
  private _includeContentTypes: string[] | undefined;

  /**
   * The content types that are included in the validation.
   */
  private _excludeContentTypes: string[] | undefined;

  /**
   * The names of files that contain metadata schemas with
   * semantic definitions
   */
  private _semanticSchemaFileNames: string[] | undefined;

  /**
   * Whether the validator should check that the content data
   * is fully contained in the content bounding volume, the
   * bounding volume of a tile, and the bounding volumes of
   * all ancestors of the tile
   */
  private _validateBoundingVolumeContainment: boolean;
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
    this._contentValidationIssueSeverity = ValidationIssueSeverity.INFO;
    this._includeContentTypes = undefined;
    this._excludeContentTypes = undefined;
    this._semanticSchemaFileNames = undefined;
    this._validateBoundingVolumeContainment = false;
  }

  /**
   * The flag that indicates whether content data should
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
   * The severity of content validation issues that should
   * be included in the result.
   *
   * By default, this will be `INFO`, meaning that all content
   * validation issues will be included. It can be set to
   * `WARNING`, to include all `ERROR` and `WARNING` issues,
   * or to `ERROR` to only include `ERROR` issues.
   */
  get contentValidationIssueSeverity(): ValidationIssueSeverity {
    return this._contentValidationIssueSeverity;
  }

  set contentValidationIssueSeverity(value: ValidationIssueSeverity) {
    this._contentValidationIssueSeverity = value;
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
   * The names of files that contain metadata schema definitions
   * for the valid metadata semantics
   */
  get semanticSchemaFileNames(): string[] | undefined {
    return this._semanticSchemaFileNames;
  }

  set semanticSchemaFileNames(value: string[] | undefined) {
    this._semanticSchemaFileNames = value;
  }

  /**
   * The flag that indicates whether the validator should check
   * that the content data is fully contained in the content
   * bounding volume, the bounding volume of a tile, and the
   * bounding volumes of all ancestors of the tile
   */
  get validateBoundingVolumeContainment(): boolean {
    return this._validateBoundingVolumeContainment;
  }

  set validateBoundingVolumeContainment(value: boolean) {
    this._validateBoundingVolumeContainment = value;
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
