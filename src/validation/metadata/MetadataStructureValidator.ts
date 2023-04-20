import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "./../ValidationContext";
import { BasicValidator } from "./../BasicValidator";

import { Schema } from "3d-tiles-tools";

import { StructureValidationIssues } from "../../issues/StructureValidationIssues";
import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";

/**
 * A class for validations related to instance definitions of
 * metadata classes. This refers to `metadataEntity` and
 * `propertyTable` definitions. It offers a method to check
 * whether the respective `class` name is a valid class name,
 * and whether the `properites` match the properties of the
 * respective class.
 *
 * @internal
 */
export class MetadataStructureValidator {
  /**
   * Performs the validation to ensure that the given properties have
   * the proper structure according to the given metadata schema.
   *
   * This will check whether
   * - the given `class` name is a valid class name in the schema
   * - each of the `properties` appears as a property name in the class
   * - each property that is marked as `required` in the class also
   *   has a value in the given `properties` dictionary
   *
   * This will **NOT** validate the property values themself. The
   * exact type of the property values will either be `anyValue`
   * objects (in a `metadataEntity`), or `propertyTable.property`
   * values (in a `propertyTable`), and therefore be validated
   * in the `MetadataEntityValidator` or `PropertyTableValidator`.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param name - A name for the object
   * @param className - The `class`
   * @param properties - The `properties`
   * @param schema - The `Schema` object. This is either the `tileset.schema`,
   * or the `Schema` object that was read from the `schemaUri`.
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the given class name and properties have the proper
   * structure according to the given metadata schema.
   */
  static validateMetadataStructure(
    path: string,
    name: string,
    className: string,
    properties: { [key: string]: any } | undefined,
    schema: Schema,
    context: ValidationContext
  ) {
    // Validate the class
    const classPath = path + "/class";
    // The class MUST be defined
    // The class MUST be a string
    if (
      !BasicValidator.validateString(classPath, "class", className, context)
    ) {
      return false;
    }

    // The class MUST appear in the schema.classes dictionary
    const metadataClasses: any = defaultValue(schema.classes, {});
    const metadataClass = metadataClasses[className];
    if (!defined(metadataClass)) {
      const message =
        `The ${name} has a class name '${className}', ` +
        `but the schema does not define this class`;
      const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
        classPath,
        message
      );
      context.addIssue(issue);
      return false;
    }

    // Here, the metadataClass is defined
    let result = true;

    const classProperties = defaultValue(metadataClass.properties, {});
    const classPropertyNames = Object.keys(classProperties);

    // Validate the properties
    const propertiesPath = path + "/properties";
    if (defined(properties)) {
      // The properties MUST be an object with at least 1 property
      if (
        !BasicValidator.validateNumberOfProperties(
          propertiesPath,
          "properties",
          properties,
          1,
          undefined,
          context
        )
      ) {
        result = false;
      } else {
        // Validate whether each property was defined in the class
        const propertyNames = Object.keys(properties);
        for (const propertyName of propertyNames) {
          // The property name MUST appear as a key in
          // the properties of the schema class
          if (!classPropertyNames.includes(propertyName)) {
            const message =
              `The properties of ${name} include a name '${propertyName}', ` +
              `but the class ${className} does not define this property`;
            const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
              path,
              message
            );
            context.addIssue(issue);
            result = false;
          }
        }
      }
    }

    // Check that all required properties are present and have a value
    for (const classPropertyName of classPropertyNames) {
      const classProperty = classProperties[classPropertyName];
      if (classProperty.required) {
        let propertyValue = undefined;
        if (defined(properties)) {
          propertyValue = properties[classPropertyName];
        }
        // The property value MUST be present if the property is 'required'
        if (!defined(propertyValue)) {
          if (classProperty.required) {
            const issue =
              MetadataValidationIssues.METADATA_VALUE_REQUIRED_BUT_MISSING(
                path,
                classPropertyName
              );
            context.addIssue(issue);
            result = false;
          }
        }
      }
    }

    return result;
  }
}
