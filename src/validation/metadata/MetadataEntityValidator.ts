import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";
import { ArrayValues } from "3d-tiles-tools";
import { ClassProperties } from "3d-tiles-tools";
import { ClassProperty } from "3d-tiles-tools";
import { MetadataValues } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";
import { MetadataEntity } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { RootPropertyValidator } from "../RootPropertyValidator";
import { ExtendedObjectsValidators } from "../ExtendedObjectsValidators";

import { MetadataStructureValidator } from "./MetadataStructureValidator";
import { MetadataValueValidator } from "./MetadataValueValidator";
import { MetadataValuesValidationMessages } from "./MetadataValueValidationMessages";

import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";

/**
 * A class for validations related to `metadataEntity` objects.
 *
 * @internal
 */
export class MetadataEntityValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `metadataEntity` object.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param name - A name for the object
   * @param metadataEntity - The object to validate
   * @param schema - The `Schema` object. This is either the `tileset.schema`,
   * or the `Schema` object that was read from the `schemaUri`.
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the given object is a valid metadataEntity object
   */
  static validateMetadataEntity(
    path: string,
    name: string,
    metadataEntity: MetadataEntity,
    schema: Schema,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, metadataEntity, context)) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        path,
        name,
        metadataEntity,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(
        path,
        metadataEntity,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(metadataEntity)) {
      return result;
    }

    // Validate that the class and properties are structurally
    // valid and comply to the metadata schema
    const className = metadataEntity.class;
    const entityProperties = metadataEntity.properties;
    if (
      !MetadataStructureValidator.validateMetadataStructure(
        path,
        name,
        className,
        entityProperties,
        schema,
        context
      )
    ) {
      result = false;
      // Bail out early if the structure is not valid!
      return result;
    }

    // Here, the basic structure of the class and properties
    // have been determined to be valid. Continue to validate
    // the values of the properties.
    const metadataClasses = defaultValue(schema.classes, {});
    const metadataClass = metadataClasses[className];
    const classProperties = defaultValue(metadataClass.properties, {});
    const validProperties = defaultValue(entityProperties, {});
    const validPropertyNames = Object.keys(validProperties);

    // Validate each property
    for (const propertyName of validPropertyNames) {
      const propertyPath = path + "/" + propertyName;
      const classProperty = classProperties[propertyName];

      // Note: The check whether 'required' properties are
      // present and have values was already done by the
      // MetadataStructureValidator
      const propertyValue = validProperties[propertyName];
      if (defined(propertyValue)) {
        // The property value MUST match the structure
        // of the property definition
        if (
          !MetadataValueValidator.validateValueStructure(
            propertyPath,
            propertyName,
            classProperty,
            propertyName,
            propertyValue,
            true,
            schema,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // If everything seemed to be valid until now, validate
    // the metadata entity values
    if (result) {
      // Validate each property
      for (const propertyName of validPropertyNames) {
        const propertyPath = path + "/" + propertyName;
        const classProperty = classProperties[propertyName];
        const rawPropertyValue = validProperties[propertyName];
        if (defined(rawPropertyValue)) {
          if (
            !MetadataEntityValidator.validateMetadataEntityPropertyValue(
              propertyPath,
              propertyName,
              rawPropertyValue,
              classProperty,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }

    return result;
  }

  /**
   * Ensure that the given value is valid for the given class property.
   *
   * This checks whether the value obeys the min/max that have been
   * defined in the class property.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyName - The property name
   * @param rawPropertyValue - The raw property value from the JSON,
   * without normalization, offset, or scale
   * @param classProperty - The class property that describes the
   * structure of the property
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the given value was valid
   */
  private static validateMetadataEntityPropertyValue(
    path: string,
    propertyName: string,
    rawPropertyValue: any,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    let result = true;
    if (ClassProperties.hasNumericType(classProperty)) {
      const propertyValue = MetadataValues.processValue(
        classProperty,
        undefined,
        undefined,
        rawPropertyValue
      );

      // When the ClassProperty defines a minimum, then the metadata
      // values MUST not be smaller than this minimum
      if (defined(classProperty.min)) {
        const definedMin = classProperty.min;
        if (ArrayValues.anyDeepLessThan(propertyValue, definedMin)) {
          const valueMessagePart =
            MetadataValuesValidationMessages.createValueMessagePart(
              rawPropertyValue,
              classProperty,
              {},
              propertyValue
            );

          const message =
            `For property '${propertyName}', the class property ` +
            `defines a minimum of ${definedMin}, but the value ` +
            `in the metadata entity is ${valueMessagePart}`;
          const issue = MetadataValidationIssues.METADATA_VALUE_NOT_IN_RANGE(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }

      // When the ClassProperty defines a maximum, then the metadata
      // values MUST not be greater than this maximum
      if (defined(classProperty.max)) {
        const definedMax = classProperty.max;
        if (ArrayValues.anyDeepGreaterThan(propertyValue, definedMax)) {
          const valueMessagePart =
            MetadataValuesValidationMessages.createValueMessagePart(
              rawPropertyValue,
              classProperty,
              {},
              propertyValue
            );

          const message =
            `For property '${propertyName}', the class property ` +
            `defines a maximum of ${definedMax}, but the value ` +
            `in the metadata entity is ${valueMessagePart}`;
          const issue = MetadataValidationIssues.METADATA_VALUE_NOT_IN_RANGE(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }
    }
    return result;
  }
}
