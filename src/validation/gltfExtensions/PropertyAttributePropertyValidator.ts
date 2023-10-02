import { ClassProperty } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";

import { MetadataPropertyValidator } from "../metadata/MetadataPropertyValidator";

/**
 * A class for validations related to `propertyAttribute.property` objects.
 *
 * @internal
 */
export class PropertyAttributePropertyValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `propertyAttribute.property` object.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyName - The name of the property
   * @param propertyAttributeProperty - The object to validate
   * @param gltf - The containing glTF object
   * @param meshPrimitive - The mesh primitive that contains the extension
   * @param classProperty - The `ClassProperty` definition from the schema
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePropertyAttributeProperty(
    path: string,
    propertyName: string,
    propertyAttributeProperty: any,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        propertyName,
        propertyAttributeProperty,
        context
      )
    ) {
      return false;
    }

    // Validate the attribute
    // The attribute MUST be defined
    // The attribute MUST be a string
    const attribute = propertyAttributeProperty.attribute;
    const attributePath = path + "/index";
    if (
      !BasicValidator.validateString(
        attributePath,
        "attribute",
        attribute,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the offset/scale/max/min properties
    const elementsAreValid =
      MetadataPropertyValidator.validateOffsetScaleMaxMin(
        path,
        propertyAttributeProperty,
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
