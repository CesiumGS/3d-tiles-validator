import fs from "fs";

import { ValidationContext } from "./ValidationContext";

/**
 * Methods related to `ValidationContext` instances
 */
export class ValidationContexts {
  /**
   * The metadata schema that contains the definitions of the
   * Cesium Metadata semantics.
   *
   * Note that this is not a valid `Schema` object, for the reasons
   * described in `addSemanticMatchingSchema`
   */
  private static cesiumMetadataSemanticsSchema = {
    id: "CesiumMetadataSemantics-0.0.1",
    classes: {
      GeneralSemantics: {
        properties: {
          ID: {
            description: "The unique identifier for the entity.",
            type: "STRING",
          },
          NAME: {
            description:
              "The name of the entity. Names should be human-readable, and do not have to be unique.",
            type: "STRING",
          },
          DESCRIPTION: {
            description:
              "Description of the entity. Typically at least a phrase, and possibly several sentences or paragraphs.",
            type: "STRING",
          },
          ATTRIBUTION_IDS: {
            description:
              "List of attribution IDs that index into a global list of attribution strings. This semantic may be assigned to metadata at any level of granularity including tileset, group, subtree, tile, content, feature, vertex, and texel granularity. The global list of attribution strings is located in a tileset or subtree with the property semantic ATTRIBUTION_STRINGS. The following precedence order is used to locate the attribution strings: first the containing subtree (if applicable), then the containing external tileset (if applicable), and finally the root tileset.",
            type: "SCALAR",
            array: true,
            componentType: "UINT(8|16|32|64)",
          },
          ATTRIBUTION_STRINGS: {
            description:
              "List of attribution strings. Each string contains information about a data provider or copyright text. Text may include embedded markup languages such as HTML. This semantic may be assigned to metadata at any granularity (wherever STRING property values can be encoded). When used in combination with ATTRIBUTION_IDS it is assigned to subtrees and tilesets.",
            type: "STRING",
            array: true,
          },
        },
      },
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
              "The content uri. Overrides the implicit tile's generated content uri. Equivalent to tile.content.uri",
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

  /**
   * Initialize the schemas that are used for matching metadata property
   * semantics.
   *
   * This will register the default Cesium Metadata Semantic definitions,
   * as well as the semantic definitions from the specified schema files.
   *
   * @param context - The validation context
   * @param schemaFileNames - The schema file names
   */
  static initializeSemanticMatchingSchemas(
    context: ValidationContext,
    schemaFileNames: string[] | undefined
  ) {
    context.addSemanticMatchingSchema(
      ValidationContexts.cesiumMetadataSemanticsSchema
    );
    if (schemaFileNames) {
      for (const schemaFileName of schemaFileNames) {
        ValidationContexts.addSemanticMatchingSchema(context, schemaFileName);
      }
    }
  }

  /**
   * Add the specified schema to the given context, as a schema to be used
   * for matching metadata property semantics.
   *
   * The specified file is supposed to contain a full, valid metadata schema,
   * where the property names are just semantic names.
   *
   * To support legacy semantic definitions, it is allowed for the
   * `matchingSchema.classes[className].properties[semanticName].componentType`
   * to be a string that is used for creating a regular expression that the
   * actual `componentType` has to match. E.g. this may be `"FLOAT(32|64)"`
   * when the component type can either be `FLOAT32` or `FLOAT64`.
   *
   * Eventually, it might make sense to make the component types
   * unambiguous, so that the semantics definition is actually
   * a proper `Schema`. This could be achieved by specific semantics
   * like `GEOMETRIC_ERROR_FLOAT32`.
   *
   * See https://github.com/CesiumGS/3d-tiles/issues/643
   *
   * @param context - The validation context
   * @param schemaFileName - The schema file name
   */
  private static addSemanticMatchingSchema(
    context: ValidationContext,
    schemaFileName: string
  ) {
    try {
      const fileContents = fs.readFileSync(schemaFileName);
      const schema = JSON.parse(fileContents.toString());
      context.addSemanticMatchingSchema(schema);
    } catch (e) {
      console.error(e);
    }
  }
}
