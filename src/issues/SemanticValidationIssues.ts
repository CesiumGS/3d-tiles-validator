import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";
import { ValidationIssueUtils } from "./ValidationIssueUtils";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues related to the semantical validity of tilesets.
 */
export class SemanticValidationIssues {
  /**
   * Indicates that the 'version' string of a tileset asset
   * had an unknown value.
   *
   * (The known values are defined by the 'AssetValidator' class)
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static ASSET_VERSION_UNKNOWN(path: string, message: string) {
    const type = "ASSET_VERSION_UNKNOWN";
    const severity = ValidationIssueSeverity.WARNING;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the 'refine' value of a tile was valid, but
   * had an unexpected case.
   *
   * This only a warning, intended for legacy tilesets, where a
   * value like 'Replace' was still valid. Current tilesets should
   * always use uppercase values like 'REPLACE'.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static TILE_REFINE_WRONG_CASE(path: string, message: string) {
    const type = "TILE_REFINE_WRONG_CASE";
    const severity = ValidationIssueSeverity.WARNING;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the 'refine' value was not given for a root
   * tile of a tileset.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static TILE_REFINE_MISSING_IN_ROOT(path: string, message: string) {
    const type = "TILE_REFINE_MISSING_IN_ROOT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the root tile of an implicit tileset was invalid.
   *
   * This is caused by the root tile of an implicit tileset defining
   * one of the properties that are disallowed for implicit roots:
   * - tile.children
   * - tile.metadata
   * - tile.content.boundingVolume
   *
   * It may also indicate that the required subtree information
   * could not be created (for example, when the subtree data
   * could not be read)
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static TILE_IMPLICIT_ROOT_INVALID(path: string, message: string) {
    const type = "TILE_IMPLICIT_ROOT_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a single bounding volume was invalid.
   *
   * This refers to certain constraints that are applied to
   * specific bounding volume types. For example, that the
   * radius of a bounding sphere may not be negative, or
   * that the borders of a bounding regions are within
   * valid ranges.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static BOUNDING_VOLUME_INVALID(path: string, message: string) {
    const type = "BOUNDING_VOLUME_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a bounding volume structure was inconsistent.
   *
   * For now, this only means that a content bounding volume was
   * not fully contained in the tile bounding volume.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static BOUNDING_VOLUMES_INCONSISTENT(path: string, message: string) {
    const type = "BOUNDING_VOLUMES_INCONSISTENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a geometry type is invalid for the specific context.
   *
   * This is used for geometric validation where certain geometry types
   * are not allowed or supported. For example, when an extension requires
   * only specific geometry types like Polygon or MultiPolygon, but other
   * types like Point or LineString are found.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static INVALID_GEOMETRY_TYPE(path: string, message: string) {
    const type = "INVALID_GEOMETRY_TYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a geometry has an invalid size or insufficient data.
   *
   * This is used for geometric validation where geometries do not meet
   * minimum size requirements. For example, when a polygon ring has
   * insufficient coordinates to form a valid polygon, or when geometric
   * structures are too small to be meaningful.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static INVALID_GEOMETRY_SIZE(path: string, message: string) {
    const type = "INVALID_GEOMETRY_SIZE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a geometry has an invalid structure or topology.
   *
   * This is used for geometric validation where geometries have structural
   * problems that make them invalid. For example, when a polygon ring is
   * self-intersecting, has invalid winding order, or contains topological
   * inconsistencies that violate geometric constraints.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static INVALID_GEOMETRY_STRUCTURE(path: string, message: string) {
    const type = "INVALID_GEOMETRY_STRUCTURE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the minimum value of a 'tileset.properties'
   * element was larger than the maximum.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static PROPERTIES_MINIMUM_LARGER_THAN_MAXIMUM(path: string, message: string) {
    const type = "PROPERTIES_MINIMUM_LARGER_THAN_MAXIMUM";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates a warning that the geometric error of a tile was larger than
   * the geometric error of its parent.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static TILE_GEOMETRIC_ERRORS_INCONSISTENT(path: string, message: string) {
    const type = "TILE_GEOMETRIC_ERRORS_INCONSISTENT";
    const severity = ValidationIssueSeverity.WARNING;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a template URI contained an invalid variable name.
   *
   * The template URIs that are used for contents or subtree files
   * in implicit tiling may contain variables like \{level\}, and
   * this issue indicates that there was an invalid variable name.
   *
   * @param path - The path for the `ValidationIssue`
   * @param variableName - The variable name
   * @param validVariableNames - The valid variable names
   * @returns The `ValidationIssue`
   */
  static TEMPLATE_URI_INVALID_VARIABLE_NAME(
    path: string,
    variableName: string,
    validVariableNames: string[]
  ) {
    const type = "TEMPLATE_URI_INVALID_VARIABLE_NAME";
    const severity = ValidationIssueSeverity.ERROR;
    const names = ValidationIssueUtils.joinNames("and", ...validVariableNames);
    const message =
      `The template URI refers to the variable '${variableName}', but ` +
      `may only refer to ${names}`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a template URI did not contain an expected variable name.
   *
   * The template URIs that are used for contents or subtree files
   * in implicit tiling are expected to contain certain variable
   * names. This issue is only a 'WARNING' for the case that an
   * expected name was not used.
   *
   * @param path - The path for the `ValidationIssue`
   * @param missingVVariableNames - The missing variable names
   * @returns The `ValidationIssue`
   */
  static TEMPLATE_URI_MISSING_VARIABLE_NAME(
    path: string,
    missingVVariableNames: string[]
  ) {
    const type = "TEMPLATE_URI_MISSING_VARIABLE_NAME";
    const severity = ValidationIssueSeverity.WARNING;
    const names = ValidationIssueUtils.joinNames(
      "and",
      ...missingVVariableNames
    );
    const message = `The template URI does not use the variable names ${names}`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates an error in an implicit tileset structure.
   *
   * This is a generic error indicating that the internal structures
   * for traversing the implicit tileset could not be created.
   * Clients should rarely see this message, because errors that
   * prevent the traversal should be caught earlier (and prevent
   * the traversal attempts). But if it happens, the 'message'
   * should contain further information about the reason for
   * the error.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static IMPLICIT_TILING_ERROR(path: string, message: string) {
    const type = "IMPLICIT_TILING_ERROR";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates an inconsistency of buffers and buffer views.
   *
   * This mainly refers to the 'buffers' and 'bufferViews' of
   * an implicit subtree. It may, for example, indicate that a
   * buffer view does not fit into the buffer that it refers to.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static BUFFERS_INCONSISTENT(path: string, message: string) {
    const type = "BUFFERS_INCONSISTENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a binary buffer structure (like the 'buffers' and
   * 'bufferViews' of a subtree) contained `buffers`, but no `bufferViews`.
   *
   * This is only a WARNING, because it does not violate the specification,
   * but is certainly not intended.
   *
   * @param path - The path for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static BUFFERS_WITHOUT_BUFFER_VIEWS(path: string) {
    const type = "BUFFERS_WITHOUT_BUFFER_VIEWS";
    const message = "The object contained 'buffers' but no 'bufferViews'";
    const severity = ValidationIssueSeverity.WARNING;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a binary buffer structure (like the 'buffers' and
   * 'bufferViews' of a subtree) contained `bufferViews`, but no `buffers`
   *
   * @param path - The path for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static BUFFER_VIEWS_WITHOUT_BUFFERS(path: string) {
    const type = "BUFFER_VIEWS_WITHOUT_BUFFERS";
    const message = "The object contained 'bufferViews' but no 'buffers'";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates an inconsistency in availability information.
   *
   * The availability information for tiles, content, and child
   * subtrees that is stored as part of an implicit tileset has
   * to obey certain constraints. For example:
   * - When a content is available, then the tile must be available
   * - When a tile is available, then the parent tile must be available
   *
   * More specific information about the inconsistency is given
   * in the error message.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static SUBTREE_AVAILABILITY_INCONSISTENT(path: string, message: string) {
    const type = "SUBTREE_AVAILABILITY_INCONSISTENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a tile transform was invalid.
   *
   * The exact constraints for being 'valid' are not specified.
   * For now, this indicates that the transform matrix was
   * the zero-matrix.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static TRANSFORM_INVALID(path: string, message: string) {
    const type = "TRANSFORM_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a certain extension was listed in the
   * 'extensionsRequired', but not in the 'extensionsUsed'
   * of a tileset.
   *
   * @param path - The path for the `ValidationIssue`
   * @param extensionName - The extension name
   * @returns The `ValidationIssue`
   */
  static EXTENSION_REQUIRED_BUT_NOT_USED(path: string, extensionName: string) {
    const type = "EXTENSION_REQUIRED_BUT_NOT_USED";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The extension '${extensionName}' was declared in ` +
      `'extensionsRequired' but not in 'extensionsUsed'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a certain extension would be required
   * to be listed in the `extensionsRequired`, but was not
   * declared there.
   *
   * @param path - The path for the `ValidationIssue`
   * @param extensionName - The extension name
   * @returns The `ValidationIssue`
   */
  static EXTENSION_REQUIRED_BUT_NOT_DECLARED(
    path: string,
    extensionName: string
  ) {
    const type = "EXTENSION_REQUIRED_BUT_NOT_DECLARED";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The extension '${extensionName}' is required, but ` +
      `was not declared in 'extensionsRequired'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a certain extension was found, but was not
   * listed in the 'extensionsUsed' of a tileset.
   *
   * An extension is 'found' when it is encountered in any
   * 'someRootProperty.extensions' dictionary during the
   * traversal, or when it is an extension that allows a
   * new content type, and this type has been encountered
   * as a tile content.
   *
   * @param path - The path for the `ValidationIssue`
   * @param extensionName - The extension name
   * @returns The `ValidationIssue`
   */
  static EXTENSION_FOUND_BUT_NOT_USED(path: string, extensionName: string) {
    const type = "EXTENSION_FOUND_BUT_NOT_USED";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The extension '${extensionName}' was found, but not ` +
      `declared in 'extensionsUsed'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a certain extension was listed in the
   * 'extensionsUsed' of a tileset, but not found during
   * the traversal.
   *
   * An extension is 'found' when it is encountered in any
   * 'someRootProperty.extensions' dictionary during the
   * traversal.
   *
   * NOTE: The exact mechanism for an extension being "used" may have to be
   * reviewed. See https://github.com/CesiumGS/3d-tiles-validator/issues/231
   *
   * @param path - The path for the `ValidationIssue`
   * @param extensionName - The extension name
   * @returns The `ValidationIssue`
   */
  static EXTENSION_USED_BUT_NOT_FOUND(path: string, extensionName: string) {
    const type = "EXTENSION_USED_BUT_NOT_FOUND";
    const severity = ValidationIssueSeverity.WARNING;
    const message =
      `The extension '${extensionName}' was declared in ` +
      `'extensionsUsed', but not found`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a certain extension was found during
   * the traversal, but is not known or handled by the
   * validator in any way.
   *
   * @param path - The path for the `ValidationIssue`
   * @param extensionName - The extension name
   * @returns The `ValidationIssue`
   */
  static EXTENSION_NOT_SUPPORTED(path: string, extensionName: string) {
    const type = "EXTENSION_NOT_SUPPORTED";
    const severity = ValidationIssueSeverity.WARNING;
    const message = `The extension '${extensionName}' was used, but is not supported`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}
