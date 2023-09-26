import { defined } from "3d-tiles-tools";
import { ClassProperty } from "3d-tiles-tools";

import { ValidationContext } from "./../ValidationContext";
import { BasicValidator } from "./../BasicValidator";

import { MetadataPropertyValidator } from "../metadata/MetadataPropertyValidator";

import { GltfExtensionValidationIssues } from "../../issues/GltfExtensionValidationIssues";

/**
 * A class for validations related to `propertyTexture.property` objects.
 *
 * @internal
 */
export class PropertyTexturePropertyValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `propertyTexture.property` object.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyName - The name of the property
   * @param propertyTextureProperty - The object to validate
   * @param numBufferViews - The number of buffer views that are available
   * @param classProperty - The `ClassProperty` definition from the schema
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePropertyTextureProperty(
    path: string,
    propertyName: string,
    propertyTextureProperty: any,
    numBufferViews: number,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        propertyName,
        propertyTextureProperty,
        context
      )
    ) {
      return false;
    }

    // From the specification text for property textures:
    // Variable-length arrays are not supported in property textures
    const isVariableLengthArray =
      classProperty.array && !defined(classProperty.count);
    if (isVariableLengthArray) {
      const message =
        `The property '${propertyName}' is a variable-length array, ` +
        `which is not supported for property textures`;
      const issue =
        GltfExtensionValidationIssues.INVALID_METADATA_PROPERTY_TYPE(
          path,
          message
        );
      context.addIssue(issue);

      // Bail out early for invalid property types
      return false;
    }

    const isString = classProperty.type === "STRING";
    if (isString) {
      const message =
        `The property '${propertyName}' has the type 'STRING', ` +
        `which is not supported for property textures`;
      const issue =
        GltfExtensionValidationIssues.INVALID_METADATA_PROPERTY_TYPE(
          path,
          message
        );
      context.addIssue(issue);

      // Bail out early for invalid property types
      return false;
    }

    let result = true;

    // Validate the offset/scale/max/min properties
    const elementsAreValid =
      MetadataPropertyValidator.validateOffsetScaleMaxMin(
        path,
        propertyTextureProperty,
        propertyName,
        classProperty,
        context
      );
    if (!elementsAreValid) {
      result = false;
    }

    return result;
  }
}
