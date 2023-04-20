import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { ValidationState } from "./ValidationState";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { Statistics } from "3d-tiles-tools";

import { StructureValidationIssues } from "../issues/StructureValidationIssues";
import { StatisticsClassValidator } from "./StatisticsClassValidator";

/**
 * A class for validations related to `statistics` objects.
 *
 * @internal
 */
export class StatisticsValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `statistics` object.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param statistics - The object to validate
   * @param validationState - The `ValidationState`.
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateStatistics(
    path: string,
    statistics: Statistics,
    validationState: ValidationState,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, "statistics", statistics, context)
    ) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        path,
        "statistics",
        statistics,
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
        statistics,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(statistics)) {
      return result;
    }

    // Validate the classes
    const classes = statistics.classes;
    const classesPath = path + "/classes";
    if (defined(classes)) {
      // The classes MUST be an object
      if (
        !BasicValidator.validateObject(classesPath, "classes", classes, context)
      ) {
        result = false;
      } else {
        // The classes MUST have at least 1 property
        if (
          !BasicValidator.validateNumberOfProperties(
            classesPath,
            "classes",
            classes,
            1,
            undefined,
            context
          )
        ) {
          result = false;
        }

        // If there are classes, then there must be a schema
        if (!validationState.hasSchemaDefinition) {
          const message =
            "The tileset defines 'statistics.classes' but does not have a schema";
          const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
            classesPath,
            message
          );
          context.addIssue(issue);
          result = false;
        } else if (defined(validationState.validatedSchema)) {
          // Validate all entries of the classes dictionary
          for (const className of Object.keys(classes)) {
            const statisticsClass = classes[className];
            if (
              !StatisticsClassValidator.validateStatisticsClass(
                statisticsClass,
                className,
                validationState.validatedSchema,
                context
              )
            ) {
              result = false;
            }
          }
        }
      }
    }
    return result;
  }
}
