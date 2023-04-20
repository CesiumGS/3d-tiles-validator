// Mostly ported from https://github.com/CesiumGS/3d-tiles-validator/tree/e84202480eb6572383008076150c8e52c99af3c3

import { defaultValue } from "3d-tiles-tools";
import { defined } from "3d-tiles-tools";

import { typeToComponentsLength } from "./utility";
import { componentTypeToByteLength } from "./utility";

/**
 * Checks if the feature table JSON and feature table binary are valid
 *
 * @param featureTableJson - Feature table JSON.
 * @param featureTableBinary - Feature table binary.
 * @param featuresLength - The number of features.
 * @param featureTableSemantics - An object containing semantic information for each feature table property, specific to the tile format.
 * @returns An error message if validation fails, otherwise undefined.
 *
 * @internal
 */
function validateFeatureTable(
  featureTableJson: any,
  featureTableBinary: Buffer,
  featuresLength: number,
  featureTableSemantics: any
): string | undefined {
  for (const name in featureTableJson) {
    if (Object.prototype.hasOwnProperty.call(featureTableJson, name)) {
      if (name === "extensions" || name === "extras") {
        continue;
      }
      const property = featureTableJson[name];
      const definition = featureTableSemantics[name];
      if (!defined(definition)) {
        return `Invalid feature table property "${name}".`;
      }
      if (hasDracoProperty(featureTableJson, name)) {
        continue;
      }

      const byteOffset = property.byteOffset;
      const componentType = defaultValue(
        property.componentType,
        definition.componentType
      );
      const componentTypeOptions = definition.componentTypeOptions;
      const type = definition.type;

      const componentsLength = typeToComponentsLength(type);
      const componentByteLength = componentTypeToByteLength(componentType);
      const itemsLength = definition.global ? 1 : featuresLength;

      if (defined(byteOffset)) {
        if (!defined(componentsLength)) {
          return `Feature table binary property "${name}" has invalid type "${type}".`;
        }

        if (!defined(componentByteLength)) {
          return `Feate table binary property "${name}" has invalid componentType "${componentType}".`;
        }

        if (typeof byteOffset !== "number") {
          return `Feature table binary property "${name}" byteOffset must be a number.`;
        }
        if (
          defined(componentTypeOptions) &&
          defined(componentTypeOptions) &&
          componentTypeOptions.indexOf(componentType) === -1
        ) {
          return `Feature table binary property "${name}" has invalid componentType "${componentType}".`;
        }
        if (byteOffset % componentByteLength > 0) {
          return `Feature table binary property "${name}" must be aligned to a ${componentByteLength}-byte boundary.`;
        }
        const propertyByteLength =
          componentsLength * componentByteLength * itemsLength;
        if (byteOffset + propertyByteLength > featureTableBinary.length) {
          return `Feature table binary property "${name}" exceeds feature table binary byte length.`;
        }
      } else if (type === "boolean") {
        if (typeof property !== "boolean") {
          return `Feature table property "${name}" must be a boolean.`;
        }
      } else {
        if (!defined(componentsLength)) {
          return `Feature table binary property "${name}" has invalid type "${type}".`;
        }
        const arrayLength = componentsLength * itemsLength;
        if (definition.global && arrayLength === 1) {
          if (typeof property !== "number") {
            return `Feature table property "${name}" must be a number.`;
          }
        } else {
          if (!Array.isArray(property)) {
            return `Feature table property "${name}" must be an array.`;
          }
          if (property.length !== arrayLength) {
            return `Feature table property "${name}" must be an array of length ${arrayLength}.`;
          }
          for (let i = 0; i < arrayLength; i++) {
            if (typeof property[i] !== "number") {
              return `Feature table property "${name}" array must contain numbers only.`;
            }
          }
        }
      }
    }
  }
}

function hasDracoProperty(
  featureTableJson: any,
  propertyName: string
): boolean {
  const extensions = featureTableJson.extensions;
  if (defined(extensions)) {
    const dracoExtension = extensions["3DTILES_draco_point_compression"];
    if (defined(dracoExtension)) {
      return defined(dracoExtension.properties[propertyName]);
    }
  }
  return false;
}

export { validateFeatureTable };
