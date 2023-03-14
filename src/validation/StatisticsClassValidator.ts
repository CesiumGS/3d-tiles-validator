import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { StatisticsClass } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";

import { StructureValidationIssues } from "../issues/StructureValidationIssues";
import { defaultValue } from "3d-tiles-tools";

/**
 * A class for validations related to `StatisticsClass` objects.
 *
 * @internal
 */
export class StatisticsClassValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `statisticsClass` object.
   *
   * @param statisticsClass - The object to validate
   * @param className - The name of the class, used as the
   * key in the `statistics.classes` dictionary, as well as the
   * key in the `schema.classes` dictionary.
   * @param schema - The `Schema` object. This is either the `tileset.schema`,
   * or the `Schema` object that was read from the `schemaUri`.
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateStatisticsClass(
    statisticsClass: StatisticsClass,
    className: string,
    schema: Schema,
    context: ValidationContext
  ): boolean {
    const classPath = "/statistics/classes/" + className;

    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        classPath,
        className,
        statisticsClass,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        classPath,
        className,
        statisticsClass,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(
        classPath,
        schema,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(schema)) {
      return result;
    }

    // Each class that appears in the statistics MUST be
    // one of the classes defined in the schema
    const metadataClasses: any = defined(schema.classes) ? schema.classes : {};
    const metadataClass = metadataClasses[className];
    if (!defined(metadataClass)) {
      const message =
        `Statistics contain a class name ${className}, ` +
        `but the schema does not define this class`;
      const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
        classPath,
        message
      );
      context.addIssue(issue);
      result = false;
    } else {
      // Each property name of the statistics class MUST be a
      // property name of the schema class
      const metadataClassPropertyNames = Object.keys(metadataClass.properties);

      // The statistics class MUST have at least 1 property
      const statisticsClassProperties = defaultValue(
        statisticsClass.properties,
        {}
      );
      if (
        !BasicValidator.validateNumberOfProperties(
          classPath,
          "properties",
          statisticsClassProperties,
          1,
          undefined,
          context
        )
      ) {
        result = false;
      } else {
        for (const statisticsClassPropetyName of Object.keys(
          statisticsClassProperties
        )) {
          if (
            !metadataClassPropertyNames.includes(statisticsClassPropetyName)
          ) {
            const message =
              `Statistics class '${className}' contains a property name ` +
              `'${statisticsClassPropetyName}', but the schema class does ` +
              `not define this property`;
            const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
              classPath,
              message
            );
            context.addIssue(issue);
            result = false;
          } else {
            // TODO Validate the constraints for the statistics.class.property.
            // This COULD include checks for (min>max). But first, it should
            // check the types (e.g. that 'min' is only used for numeric types)
          }
        }
      }
    }
    return result;
  }
}
