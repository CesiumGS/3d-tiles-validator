import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "./../ValidationContext";

import { ClassProperty } from "3d-tiles-tools";

import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";

/**
 * A class for validations of the `semantic` values of
 * `ClassProperty` objects.
 *
 * @internal
 */
export class ClassPropertySemanticsValidator {
  /**
   * Validate the `semantic` values of the given properties.
   *
   * This assumes that the properties have already been validated
   * with the `ClassPropertyValidator`, ensuring that the `semantic`
   * values are valid strings.
   *
   * @param metadataClassPath - The path for `ValidationIssue` instances
   * @param properties - The properties of the schema class
   * @param context - The `ValidatonContext`
   * @returns Whether the object was valid
   */
  static validateSemantics(
    metadataClassPath: string,
    properties: { [key: string]: ClassProperty },
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate that the 'semantic' of all properties
    // are unique
    const semanticsToPropertyNames: any = {};
    for (const propertyName of Object.keys(properties)) {
      const property = properties[propertyName];
      if (defined(property)) {
        const semantic = property.semantic;
        if (defined(semantic)) {
          const otherPropertyName = semanticsToPropertyNames[semantic];
          if (defined(otherPropertyName)) {
            const issue =
              MetadataValidationIssues.CLASS_PROPERTIES_DUPLICATE_SEMANTIC(
                metadataClassPath,
                propertyName,
                otherPropertyName,
                semantic
              );
            context.addIssue(issue);
            result = false;
          }
          semanticsToPropertyNames[semantic] = propertyName;
        }
      }
    }

    // Validate that the type of the property matches
    // the type that is required via the semantic
    const matchingSchema =
      ClassPropertySemanticsValidator.createMatchingSchema();
    for (const propertyName of Object.keys(properties)) {
      const property = properties[propertyName];
      if (!defined(property)) {
        continue;
      }
      const semantic = property.semantic;
      if (!defined(semantic)) {
        continue;
      }
      const propertyPath = metadataClassPath + "/properties/" + propertyName;

      // Find the "matcher" for the given semantic. This is just
      // the "property" in the `matchingSchema` whose name is
      // the same as the `semantic`. If no matcher is found for
      // the given semantic, a warning will be created
      const semanticMatcher =
        ClassPropertySemanticsValidator.findSemanticMatcher(
          matchingSchema,
          semantic
        );
      if (!defined(semanticMatcher)) {
        const issue = MetadataValidationIssues.METADATA_SEMANTIC_UNKNOWN(
          propertyPath,
          propertyName,
          semantic
        );
        context.addIssue(issue);
      } else {
        // Check whether the structure of the property
        // matches the one required by the matcher
        if (
          !ClassPropertySemanticsValidator.validateSemantic(
            propertyPath,
            propertyName,
            property,
            semantic,
            semanticMatcher,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // TODO The constraints for the values that are imposed
    // by the semantics are not validated yet. For example,
    // this should apply the `BoundingVolumeValidator` to
    // properties with the TILE_BOUNDING_REGION, or check
    // that TILE_REFINE only has a value of 0 or 1.

    return result;
  }

  /**
   * Validate that the type of the given property matches the
   * requirements that are defined by the given matcher.
   *
   * For information about the 'semanticMatcher', see createMatchingSchema.
   *
   * @param propertyPath - The path for `ValidationIssue` instances
   * @param propertyName - The name of the property
   * @param property - The `ClassProperty`
   * @param semantic - The `semantic`
   * @param semanticMatcher - The semantic matcher
   * @param context - The `ValidationContext`
   * @returns Whether the property type matched the structure
   * that is defined by the given matcher
   */
  private static validateSemantic(
    propertyPath: string,
    propertyName: string,
    property: ClassProperty,
    semantic: string,
    semanticMatcher: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    if (property.type !== semanticMatcher.type) {
      const message =
        `Property '${propertyName} has semantic '${semantic}', ` +
        `which requires type '${semanticMatcher.type}', but the ` +
        `property has type '${property.type}'`;
      const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
        propertyPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    if (defined(semanticMatcher.componentType)) {
      const componentType = defaultValue(property.componentType, "undefined");
      const regex = new RegExp("^" + semanticMatcher.componentType + "$");
      if (!regex.test(componentType)) {
        const message =
          `Property '${propertyName} has semantic '${semantic}', ` +
          `which requires the component type to match ` +
          `'${semanticMatcher.componentType}', but the ` +
          `property has component type '${componentType}'`;
        const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
          propertyPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }
    const matcherArray = defaultValue(semanticMatcher.array, false);
    const propertyArray = defaultValue(property.array, false);
    if (propertyArray !== matcherArray) {
      const message =
        `Property '${propertyName} has semantic '${semantic}', ` +
        `which requires the 'array' property to be '${matcherArray}' ` +
        `but the 'array' property is '${property.array}'`;
      const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
        propertyPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    if (property.array === true) {
      if (property.count !== semanticMatcher.count) {
        const message =
          `Property '${propertyName} has semantic '${semantic}', which ` +
          `requires the 'count' property to be '${semanticMatcher.count}' ` +
          `but the 'count' property is '${property.count}'`;
        const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
          propertyPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    const matcherNormalized = defaultValue(semanticMatcher.normalized, false);
    const propertyNormalized = defaultValue(property.normalized, false);
    if (propertyNormalized !== matcherNormalized) {
      const message =
        `Property '${propertyName} has semantic '${semantic}', which ` +
        `requires the 'normalized' property to be '${matcherNormalized}' ` +
        `but the 'normalized' property is '${property.normalized}'`;
      const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
        propertyPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    // There currently are no semantics that involve an `enumType`,
    // but the check is done here for completeness
    if (property.enumType !== semanticMatcher.enumType) {
      const message =
        `Property '${propertyName} has semantic '${semantic}', ` +
        `which requires enumType '${semanticMatcher.enumType}', but the ` +
        `property has enumType '${property.enumType}'`;
      const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
        propertyPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    return result;
  }
  private static findSemanticMatcher(
    matchingSchema: any,
    semantic: string
  ): any {
    const matchingClasses = defaultValue(matchingSchema.classes, {});
    for (const className of Object.keys(matchingClasses)) {
      const matchingClass = matchingClasses[className];
      const matchingProperties = defaultValue(matchingClass.properties, {});
      for (const semanticName of Object.keys(matchingProperties)) {
        if (semanticName === semantic) {
          return matchingProperties[semanticName];
        }
      }
    }
    return undefined;
  }

  /**
   * Creates an object that resembles a `Schema`, but that is
   * used for matching the `semantic` of properties.
   *
   * The only difference to a `Schema` is that the
   * `matchingSchema.classes[className].properties[semanticName].componentType`
   * is a string that is used for creating a regular expression that the
   * actual `componentType` has to match. E.g. this may be `"FLOAT(32|64)"`
   * when the component type can either be `FLOAT32` or `FLOAT64`.
   *
   * Eventually, it might make sense to make the component types
   * unambiguous, so that the semantics definition is actually
   * a proper `Schema`. This could be achived by specific semantics
   * like `GEOMETRIC_ERROR_FLOAT32`.
   *
   * See https://github.com/CesiumGS/3d-tiles/issues/643
   *
   * @returns The matching schema
   */
  private static createMatchingSchema() {
    const matchingSchema = {
      id: "CesiumMetadataSemantics-0.0.0",
      classes: {
        TilesetMetadataSemantics: {
          properties: {
            TILESET_FEATURE_ID_LABELS: {
              description:
                "The union of all the feature ID labels in glTF content using the EXT_mesh_features and EXT_instance_features extensions.",
              type: "STRING",
              array: true,
            },
            TILESET_CRS_GEOCENTRIC: {
              description:
                "The geocentric coordinate reference system (CRS) of the tileset.",
              type: "STRING",
            },
            TILESET_CRS_COORDINATE_EPOCH: {
              description:
                "The coordinate epoch for coordinates that are referenced to a dynamic CRS such as WGS 84.",
              type: "STRING",
            },
          },
        },
        TileMetadataSemantics: {
          properties: {
            TILE_BOUNDING_BOX: {
              description:
                "The bounding volume of the tile, expressed as a box. Equivalent to tile.boundingVolume.box.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
              array: true,
              count: 12,
            },
            TILE_BOUNDING_REGION: {
              description:
                "The bounding volume of the tile, expressed as a region. Equivalent to tile.boundingVolume.region.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
              array: true,
              count: 6,
            },
            TILE_BOUNDING_SPHERE: {
              description:
                "The bounding volume of the tile, expressed as a sphere. Equivalent to tile.boundingVolume.sphere.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
              array: true,
              count: 4,
            },
            TILE_BOUNDING_S2_CELL: {
              description:
                "The bounding volume of the tile, expressed as an S2 Cell ID using the 64-bit representation instead of the hexadecimal representation. Only applicable to 3DTILES_bounding_volume_S2.",
              type: "SCALAR",
              componentType: "UINT64",
            },
            TILE_MINIMUM_HEIGHT: {
              description:
                "The minimum height of the tile above (or below) the WGS84 ellipsoid.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
            },
            TILE_MAXIMUM_HEIGHT: {
              description:
                "The maximum height of the tile above (or below) the WGS84 ellipsoid.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
            },
            TILE_HORIZON_OCCLUSION_POINT: {
              description:
                "The horizon occlusion point of the tile expressed in an ellipsoid-scaled fixed frame. If this point is below the horizon, the entire tile is below the horizon.",
              type: "VEC3",
              componentType: "FLOAT(32|64)",
            },
            TILE_GEOMETRIC_ERROR: {
              description:
                "The geometric error of the tile. Equivalent to tile.geometricError.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
            },
            TILE_REFINE: {
              description:
                "The tile refinement type. Valid values are 0 (ADD) and 1 (REPLACE). Equivalent to tile.refine.",
              type: "SCALAR",
              componentType: "UINT8",
            },
            TILE_TRANSFORM: {
              description: "The tile transform. Equivalent to tile.transform.",
              type: "MAT4",
              componentType: "FLOAT(32|64)",
            },
          },
        },
        ContentMetadataSemantics: {
          properties: {
            CONTENT_BOUNDING_BOX: {
              description:
                "The bounding volume of the content of a tile, expressed as a box. Equivalent to tile.content.boundingVolume.box.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
              array: true,
              count: 12,
            },
            CONTENT_BOUNDING_REGION: {
              description:
                "The bounding volume of the content of a tile, expressed as a region. Equivalent to tile.content.boundingVolume.region.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
              array: true,
              count: 6,
            },
            CONTENT_BOUNDING_SPHERE: {
              description:
                "The bounding volume of the content of a tile, expressed as a sphere. Equivalent to tile.content.boundingVolume.sphere.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
              array: true,
              count: 4,
            },
            CONTENT_BOUNDING_S2_CELL: {
              description:
                "The bounding volume of the content of a tile, expressed as an S2 Cell ID using the 64-bit representation instead of the hexadecimal representation. Only applicable to 3DTILES_bounding_volume_S2.",
              type: "SCALAR",
              componentType: "UINT64",
            },
            CONTENT_MINIMUM_HEIGHT: {
              description:
                "The minimum height of the content of a tile above (or below) the WGS84 ellipsoid.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
            },
            CONTENT_MAXIMUM_HEIGHT: {
              description:
                "The maximum height of the content of a tile above (or below) the WGS84 ellipsoid.",
              type: "SCALAR",
              componentType: "FLOAT(32|64)",
            },
            CONTENT_HORIZON_OCCLUSION_POINT: {
              description:
                "The horizon occlusion point of the content of a tile expressed in an ellipsoid-scaled fixed frame. If this point is below the horizon, the entire content is below the horizon.",
              type: "VEC3",
              componentType: "FLOAT(32|64)",
            },
            CONTENT_URI: {
              description:
                "The content uri. Overrides the implicit tile’s generated content uri. Equivalent to tile.content.uri",
              type: "STRING",
              componentType: "FLOAT(32|64)",
            },
            CONTENT_GROUP_ID: {
              description:
                "The content group ID. Equivalent to tile.content.group.",
              type: "SCALAR",
              componentType: "UINT(8|16|32|64)",
            },
          },
        },
      },
    };
    return matchingSchema;
  }
}
