import path from "path";

import { JsonSchemaValidatorAjv } from "./JsonSchemaValidatorAjv";

export class JsonSchemaValidators {
  // prettier-ignore
  static create3DTiles(schemaRootDir : string, schemaIdentifier: string) {

    const v = new JsonSchemaValidatorAjv(schemaIdentifier);
    function addSchema(name: string, relativeSchemaPath : string, errorMessage? : any) {
      const schemaPath = path.resolve(schemaRootDir, relativeSchemaPath)
      v.addSchema(name, schemaPath, errorMessage);
    }

    // Yes, this looks obscure. But the URI resolution mechanisms
    // of JSON schema are quirky, and not really exposed by ajv.
    // There might be a solution that is a bit less verbose, using
    // the `loadSchema` function. But still, the fact that, for
    // example, the `rootProperty` is supposed to be looked up
    // in the `common` subdirectory has to be encoded somewhere.
    // So let's go with the simple (although verbose) approach for now:

    addSchema("common/definitions", "common/definitions.schema.json");
    addSchema("common/extension", "common/extension.schema.json");
    addSchema("common/extras", "common/extras.schema.json");
    addSchema("common/rootProperty", "common/rootProperty.schema.json");

    addSchema("asset", "asset.schema.json");
    addSchema("boundingVolume", "boundingVolume.schema.json");
    addSchema("content", "content.schema.json");
    addSchema("group", "group.schema.json");
    addSchema("metadataEntity", "metadataEntity.schema.json");
    addSchema("properties", "properties.schema.json");
    addSchema("subtrees", "subtrees.schema.json");
    addSchema("templateUri", "templateUri.schema.json");
    addSchema("tile.implicitTiling", "tile.implicitTiling.schema.json");

    const tileCustomErrorMessage = {
      not: "may either have a content or contents, but not both",
    };
    addSchema("tile", "tile.schema.json", tileCustomErrorMessage);

    const tilesetCustomErrorMessage = {
      not: "may either have a schema and schemaUri, but not both",
    };
    addSchema("tileset", "tileset.schema.json", tilesetCustomErrorMessage);
    
    addSchema("PropertyTable/propertyTable.property", "PropertyTable/propertyTable.property.schema.json");
    addSchema("PropertyTable/propertyTable", "PropertyTable/propertyTable.schema.json");
    
    addSchema("Schema/class.property", "Schema/class.property.schema.json");
    addSchema("Schema/class", "Schema/class.schema.json");
    addSchema("Schema/enum", "Schema/enum.schema.json");
    addSchema("Schema/enum.value", "Schema/enum.value.schema.json");
    addSchema("Schema/schema", "Schema/schema.schema.json");
    
    addSchema("Statistics/statistics.class.property", "Statistics/statistics.class.property.schema.json");
    addSchema("Statistics/statistics.class", "Statistics/statistics.class.schema.json");
    addSchema("Statistics/statistics", "Statistics/statistics.schema.json");
    
    addSchema("Styling/pnts.style", "Styling/pnts.style.schema.json");
    addSchema("Styling/style.booleanExpression", "Styling/style.booleanExpression.schema.json");
    addSchema("Styling/style.colorExpression", "Styling/style.colorExpression.schema.json");
    addSchema("Styling/style.conditions.condition", "Styling/style.conditions.condition.schema.json");
    addSchema("Styling/style.conditions", "Styling/style.conditions.schema.json");
    addSchema("Styling/style.expression", "Styling/style.expression.schema.json");
    addSchema("Styling/style.meta", "Styling/style.meta.schema.json");
    addSchema("Styling/style.numberExpression", "Styling/style.numberExpression.schema.json");
    addSchema("Styling/style", "Styling/style.schema.json");
    
    addSchema("Subtree/availability", "Subtree/availability.schema.json");
    addSchema("Subtree/buffer", "Subtree/buffer.schema.json");
    addSchema("Subtree/bufferView", "Subtree/bufferView.schema.json");
    addSchema("Subtree/subtree", "Subtree/subtree.schema.json");
    
    addSchema("TileFormats/b3dm.featureTable", "TileFormats/b3dm.featureTable.schema.json");
    addSchema("TileFormats/batchTable", "TileFormats/batchTable.schema.json");
    addSchema("TileFormats/featureTable", "TileFormats/featureTable.schema.json");
    addSchema("TileFormats/i3dm.featureTable", "TileFormats/i3dm.featureTable.schema.json");
    addSchema("TileFormats/pnts.featureTable", "TileFormats/pnts.featureTable.schema.json");

    return v;
  }
}
