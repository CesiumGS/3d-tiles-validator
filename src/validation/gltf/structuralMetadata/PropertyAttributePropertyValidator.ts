import { ClassProperties, ClassProperty, defined } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";

import { MetadataPropertyValidator } from "../../metadata/MetadataPropertyValidator";
import { GltfExtensionValidationIssues } from "../../../issues/GltfExtensionValidationIssues";

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
   * @param classProperty - The `ClassProperty` definition from the schema
   * @param enumValueType - The `valueType` of the enum, if the class
   * property is an ENUM type
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePropertyAttributeProperty(
    path: string,
    propertyName: string,
    propertyAttributeProperty: any,
    classProperty: ClassProperty,
    enumValueType: string | undefined,
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
    const attributePath = path + "/attribute";
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

    // Make sure that the type of the class property is valid for
    // a property attribute in general.
    const typeIsValid =
      PropertyAttributePropertyValidator.validateClassPropertyForPropertyAttributeProperty(
        path,
        propertyName,
        classProperty,
        enumValueType,
        context
      );
    if (!typeIsValid) {
      result = false;
    }

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

  /**
   * Validates that the given `classProperty` is basically suitable
   * for a property attribute, meaning that its type is one of the
   * types that can be represented with a glTF vertex attribute.
   *
   * If the type is not valid, then a validation error will be added
   * to the given context, and `false` will be returned.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyName - The name of the property
   * @param classProperty - The `ClassProperty` definition from the schema
   * @param enumValueType - The `valueType` of the enum, if the class
   * property is an ENUM type
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateClassPropertyForPropertyAttributeProperty(
    path: string,
    propertyName: string,
    classProperty: ClassProperty,
    enumValueType: string | undefined,
    context: ValidationContext
  ): boolean {
    // The specification says
    // > The property types that are supported via property attributes are
    // > therefore restricted to the types that are supported by standard
    // > glTF accessors.

    // glTF accessors cannot represent arrays
    if (classProperty.array === true) {
      const message =
        `The property '${propertyName}' is an array, ` +
        `which is not supported for property attributes`;
      const issue =
        GltfExtensionValidationIssues.INVALID_METADATA_PROPERTY_TYPE(
          path,
          message
        );
      context.addIssue(issue);
      return false;
    }

    // glTF accessors cannot represent STRING or BOOLEAN
    const type = classProperty.type;
    if (type === "STRING" || type === "BOOLEAN") {
      const message =
        `The property '${propertyName}' has the type ${type}, ` +
        `which is not supported for property attributes`;
      const issue =
        GltfExtensionValidationIssues.INVALID_METADATA_PROPERTY_TYPE(
          path,
          message
        );
      context.addIssue(issue);
      return false;
    }

    // glTF accessors can only represent certain component
    // types for numeric (SCALAR, VECn, and MATn) types
    if (ClassProperties.hasNumericType(classProperty)) {
      const componentType = classProperty.componentType!;
      const validComponentTypes = [
        "INT8",
        "UINT8",
        "INT16",
        "UINT16",
        "FLOAT32",
      ];
      if (!validComponentTypes.includes(componentType)) {
        const message =
          `The property '${propertyName}' has the component ` +
          `type ${componentType}, but the type must be ` +
          `one of ${validComponentTypes} for property attributes`;
        const issue =
          GltfExtensionValidationIssues.INVALID_METADATA_PROPERTY_TYPE(
            path,
            message
          );
        context.addIssue(issue);
        return false;
      }
    }

    // glTF accessors can only represent certain ENUM value types
    if (defined(enumValueType)) {
      // The enum valueType can be one of these types (i.e.
      // it can not be INT32, UINT32, INT64, or UINT64)
      const validEnumValueTypes = ["INT8", "UINT8", "INT16", "UINT16"];
      if (!validEnumValueTypes.includes(enumValueType)) {
        const message =
          `The property '${propertyName}' has the type 'ENUM', with ` +
          `the enum type '${classProperty.enumType}', which has a ` +
          `value type of ${enumValueType}, but the type must be ` +
          `one of ${validEnumValueTypes} for property attributes`;
        const issue =
          GltfExtensionValidationIssues.INVALID_METADATA_PROPERTY_TYPE(
            path,
            message
          );
        context.addIssue(issue);
        return false;
      }
    }

    return true;
  }
}
