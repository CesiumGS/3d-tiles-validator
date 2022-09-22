import { defined } from "../base/defined";

import { ValidationContext } from "./ValidationContext";
import { Validator } from "./Validator";
import { BasicValidator } from "./BasicValidator";

import { Schema } from "../structure/Metadata/Schema";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { SchemaClassValidator } from "./SchemaClassValidator";
import { SchemaEnumValidator } from "./SchemaEnumValidator";

/**
 * A class for validations related to `schema` objects.
 *
 * @private
 */
export class SchemaValidator implements Validator<Schema> {
  /**
   * Preliminary:
   * 
   * An optional validator that will be applied to the `Schema`
   * object, after it has been parsed from the JSON, but before
   * any further validation takes place.
   */
   private _genericValidator: Validator<any> | undefined;

  /**
   * Creates a new instance.
   * 
   * Preliminary: 
   * 
   * The given validator will be applied to the `Schema`
   * object, after it has been parsed from the JSON, but before
   * any further validation takes place.
   * 
   * @param genericValidator The optional generic validator
   */
  constructor(genericValidator: Validator<any> | undefined) {
    this._genericValidator = genericValidator;
  }

  /**
   * Performs the validation of the schema that is parsed from the
   * given input string.
   *
   * @param input The string that was read from a schema JSON file
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  async validateJsonString(
    input: string,
    context: ValidationContext
  ): Promise<void> {
    try {
      const object: Schema = JSON.parse(input);
      await this.validateObject(object, context);
    } catch (error) {
      //console.log(error);
      const issue = IoValidationIssues.JSON_PARSE_ERROR("", "" + error);
      context.addIssue(issue);
    }
  }

  /**
   * Internal method that performs the ajv-based JSON schema validation, and
   * then passes the input to `validateSchema`.
   *
   * TODO The ajv-based JSON schema validator will be removed
   *
   * @param input The `Schema` object
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  async validateObject(
    input: Schema,
    context: ValidationContext
  ): Promise<void> {
    if (defined(this._genericValidator)) {
      this._genericValidator!.validateObject(input, context);
    }
    SchemaValidator.validateSchema("", input, context);
  }

  /**
   * Performs the validation of the given `Schema` object that was parsed
   * from a schema JSON input.
   *
   * Issues that are encountered during the validation will be added
   * as `ValidationIssue` instances to the given `ValidationContext`.
   *
   * @param path The JSON path for the given object. This may either
   * be `"/schema"` (for a `tileset.schema`), or the empty string
   * (for a schema that was read from a standalone schema file).
   * @param schema The `Schema` object
   * @param context The `ValidationContext`
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
        for (const [className, schemaClass] of Object.entries(classes!)) {
          const schemaClassPath = classesPath + "/" + className;

          // Each class name name MUST match the ID regex
          if (
            !BasicValidator.validateIdentifierString(
              schemaClassPath,
              className,
              className,
              context
            )
          ) {
            result = false;
          }
          if (
            !SchemaClassValidator.validateSchemaClass(
              schemaClassPath,
              className,
              schemaClass,
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
        for (const [enumName, schemaEnum] of Object.entries(enums!)) {
          const schemaEnumPath = enumsPath + "/" + enumName;

          // Each enum name name MUST match the ID regex
          if (
            !BasicValidator.validateIdentifierString(
              schemaEnumPath,
              enumName,
              enumName,
              context
            )
          ) {
            result = false;
          }

          if (
            !SchemaEnumValidator.validateSchemaEnum(
              schemaEnumPath,
              enumName,
              schemaEnum,
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