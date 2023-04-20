// Mostly ported from https://github.com/CesiumGS/3d-tiles-validator/tree/e84202480eb6572383008076150c8e52c99af3c3
import { defined } from "3d-tiles-tools";

import { typeToComponentsLength } from "./utility";
import { componentTypeToByteLength } from "./utility";

/**
 * Checks if the batch table JSON and batch table binary are valid
 *
 * @param batchTableJson - Batch table JSON.
 * @param batchTableBinary - Batch table binary.
 * @param featuresLength - The number of features.
 * @returns An error message if validation fails, otherwise undefined.
 *
 * @internal
 */
function validateBatchTable(
  batchTableJson: any,
  batchTableBinary: Buffer,
  featuresLength: number
): string | undefined {
  for (const name in batchTableJson) {
    if (Object.prototype.hasOwnProperty.call(batchTableJson, name)) {
      if (name === "extensions" || name === "extras") {
        continue;
      }
      if (hasDracoProperty(batchTableJson, name)) {
        continue;
      }

      const property = batchTableJson[name];
      const byteOffset = property.byteOffset;

      if (defined(byteOffset)) {
        if (typeof byteOffset !== "number") {
          return `Batch table binary property "${name}" byteOffset must be a number.`;
        }

        const componentType = property.componentType;
        const type = property.type;

        if (!defined(type)) {
          return `Batch table binary property "${name}" must have a type.`;
        }

        if (!defined(componentType)) {
          return `Batch table binary property "${name}" must have a componentType.`;
        }

        const componentsLength = typeToComponentsLength(type);
        const componentByteLength = componentTypeToByteLength(componentType);

        if (!defined(componentsLength)) {
          return `Batch table binary property "${name}" has invalid type "${type}".`;
        }
        if (!defined(componentByteLength)) {
          return `Batch table binary property "${name}" has invalid componentType "${componentType}".`;
        }
        if (byteOffset % componentByteLength > 0) {
          return `Batch table binary property "${name}" must be aligned to a ${componentByteLength}-byte boundary.`;
        }
        const propertyByteLength =
          componentsLength * componentByteLength * featuresLength;
        if (byteOffset + propertyByteLength > batchTableBinary.length) {
          return `Batch table binary property "${name}" exceeds batch table binary byte length.`;
        }
      } else {
        if (!Array.isArray(property)) {
          return `Batch table property "${name}" must be an array.`;
        }
        if (property.length !== featuresLength) {
          return `Batch table property "${name}" array length must equal features length ${featuresLength}.`;
        }
      }
    }
  }
}

function hasDracoProperty(batchTableJson: any, propertyName: string): boolean {
  const extensions = batchTableJson.extensions;
  if (defined(extensions)) {
    const dracoExtension = extensions["3DTILES_draco_point_compression"];
    if (defined(dracoExtension)) {
      return defined(dracoExtension.properties[propertyName]);
    }
  }
  return false;
}

export { validateBatchTable };
