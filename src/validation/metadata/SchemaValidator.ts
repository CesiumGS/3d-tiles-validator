import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./../ValidationContext";
import { Validator } from "./../Validator";
import { BasicValidator } from "./../BasicValidator";
import { RootPropertyValidator } from "./../RootPropertyValidator";
import { ExtendedObjectsValidators } from "./../ExtendedObjectsValidators";

import { MetadataClassValidator } from "./MetadataClassValidator";
import { MetadataEnumValidator } from "./MetadataEnumValidator";

import { Schema } from "3d-tiles-tools";

import { IoValidationIssues } from "../../issues/IoValidationIssue";

/**
 * A class for validations related to `schema` objects.
 *
 * @internal
 */
export class SchemaValidator implements Validator<Schema> {
  /**
   * Performs the validation of the schema that is parsed from the
   * given input string.
   *
   * @param input - The string that was read from a schema JSON file
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  async validateJsonString(
    input: string,
    context: ValidationContext
  ): Promise<boolean> {
    try {
      const object: Schema = JSON.parse(input);
      const result = await this.validateObject("", object, context);
      return result;
    } catch (error) {
      //console.log(error);
      const issue = IoValidationIssues.JSON_PARSE_ERROR("", "" + error);
      context.addIssue(issue);
      return false;
    }
  }

  /**
   * Implementation of the `Validator` interface that just passes the
   * input to `validateSchema`.
   *
   * @param input - The `Schema` object
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  async validateObject(
    path: string,
    input: Schema,
    context: ValidationContext
  ): Promise<boolean> {
    return SchemaValidator.validateSchema(path, input, context);
  }

  /**
   * Performs the validation of the given `Schema` object that was parsed
   * from a schema JSON input.
   *
   * Issues that are encountered during the validation will be added
   * as `ValidationIssue` instances to the given `ValidationContext`.
   *
   * @param path - The path for the given object. This may either
   * be `"/schema"` (for a `tileset.schema`), or the empty string
   * (for a schema that was read from a standalone schema file).
   * @param schema - The `Schema` object
   * @param context - The `ValidationContext`
   */
  static validateSchema(
    path: string,
    schema: Schema,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "schema", schema, context)) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        path,
        "schema",
        schema,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(path, schema, context)
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(schema)) {
      return result;
    }

    // Validate the id
    const id = schema.id;
    const idPath = path + "/id";
    // The id MUST be defined
    // The id MUST be a string
    // The id MUST be a valid identifier
    if (!BasicValidator.validateIdentifierString(idPath, "id", id, context)) {
      result = false;
    }

    // Validate the name
    // If the name is defined, it MUST be a string
    if (!BasicValidator.validateOptionalString(path, schema, "name", context)) {
      result = false;
    }

    // Validate the description
    // If the description is defined, it MUST be a string
    if (
      !BasicValidator.validateOptionalString(
        path,
        schema,
        "description",
        context
      )
    ) {
      result = false;
    }

    // Validate the version
    // If the version is defined, it MUST be a string
    if (
      !BasicValidator.validateOptionalString(path, schema, "version", context)
    ) {
      result = false;
    }

    // Validate the classes
    const classes = schema.classes;
    const classesPath = path + "/classes";
    if (defined(classes)) {
      // The classes MUST be an object
      if (
        !BasicValidator.validateObject(classesPath, "classes", classes, context)
      ) {
        result = false;
      } else {
        for (const [className, metadataClass] of Object.entries(classes)) {
          const metadataClassPath = classesPath + "/" + className;

          // Each class name name MUST match the ID regex
          if (
            !BasicValidator.validateIdentifierString(
              metadataClassPath,
              className,
              className,
              context
            )
          ) {
            result = false;
          }
          if (
            !MetadataClassValidator.validateMetadataClass(
              metadataClassPath,
              className,
              metadataClass,
              schema,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }

    // Validate the enums
    const enums = schema.enums;
    const enumsPath = path + "/enums";
    if (defined(enums)) {
      // The enums MUST be an object
      if (!BasicValidator.validateObject(enumsPath, "enums", enums, context)) {
        result = false;
      } else {
        for (const [enumName, metadataEnum] of Object.entries(enums)) {
          const metadataEnumPath = enumsPath + "/" + enumName;

          // Each enum name name MUST match the ID regex
          if (
            !BasicValidator.validateIdentifierString(
              metadataEnumPath,
              enumName,
              enumName,
              context
            )
          ) {
            result = false;
          }

          if (
            !MetadataEnumValidator.validateMetadataEnum(
              metadataEnumPath,
              enumName,
              metadataEnum,
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
}
