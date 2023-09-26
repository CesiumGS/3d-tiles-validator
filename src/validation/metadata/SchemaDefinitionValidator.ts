import { defined } from "3d-tiles-tools";
import { Buffers } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { SchemaValidator } from "./SchemaValidator";
import { ValidatedElement } from "../ValidatedElement";

import { IoValidationIssues } from "../../issues/IoValidationIssue";
import { JsonValidationIssues } from "../../issues/JsonValidationIssues";

/**
 * Utility class for validating the definition of a metadata schema.
 *
 * The metadata schema can either be defined as an inlined `schema`
 * object in the JSON, or via a `schemUri` (but not both!).
 * This class resolves and validates the schema from either of
 * these sources, and returns information about that validation
 * result.
 */
export class SchemaDefinitionValidator {
  /**
   * Validates the given schema definition.
   *
   * The returned object will contain two properties:
   * - `wasPresent`: Whether any schema definition was given
   * - `validatedElement`: The validated `Schema` object
   *
   * If neither `schema` nor `schemaUri` are given, then the result
   * will be `{false, undefined}`.
   *
   * If the `schema` and `schemaUri` are both given, then an error will be
   * added to the given context, and `{ true, undefined }` will be returned.
   *
   * If the `schemaUri` is given but invalid, then an error will be
   * added to the given context, and `{ true, undefined }` will be returned.
   *
   * If the `schema` was given, or the schema could be resolved from
   * the `schemaUri`, and the schema turned out to be valid, then
   * `{ true, validatedSchema }` will be returned.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param name - A name for the containing object (usually 'tileset')
   * @param schema - The `schema` object from the JSON
   * @param schemaUri - The `schemaUri` from the JSON
   * @param context - The `ValidatonContext`
   * @returns The schema definition validation result
   */
  static async validateSchemaDefinition(
    path: string,
    name: string,
    schema: any,
    schemaUri: any,
    context: ValidationContext
  ): Promise<ValidatedElement<Schema>> {
    // The schema and schemaUri MUST NOT be present at the same time
    if (defined(schema) && defined(schemaUri)) {
      const issue = JsonValidationIssues.ONE_OF_ERROR(
        path,
        name,
        "schema",
        "schemaUri"
      );
      context.addIssue(issue);
      return {
        wasPresent: true,
        validatedElement: undefined,
      };
    }

    // Validate the schemaUri
    const schemaUriPath = path + "/schemaUri";
    if (defined(schemaUri)) {
      // The schemaUri MUST be a string
      if (
        !BasicValidator.validateString(
          schemaUriPath,
          "schemaUri",
          schemaUri,
          context
        )
      ) {
        return {
          wasPresent: true,
          validatedElement: undefined,
        };
      }
    }

    // The schema to validate is either the given one,
    // or the one that is resolved from the schemaUri
    let schemaToValidate = undefined;
    if (defined(schema)) {
      schemaToValidate = schema;
    } else if (defined(schemaUri)) {
      const resolvedSchema = await SchemaDefinitionValidator.resolveSchema(
        path,
        schemaUri,
        context
      );
      if (!defined(resolvedSchema)) {
        return {
          wasPresent: true,
          validatedElement: undefined,
        };
      }
      schemaToValidate = resolvedSchema;
    } else {
      // Neither the schema nor the schemaUri have been given
      return {
        wasPresent: false,
        validatedElement: undefined,
      };
    }

    // Validate the schema
    let validatedSchema = undefined;
    const schemaPath = path + "/schema";
    if (defined(schemaToValidate)) {
      if (
        SchemaValidator.validateSchema(schemaPath, schemaToValidate, context)
      ) {
        validatedSchema = schemaToValidate;
      }
    }

    return {
      wasPresent: true,
      validatedElement: validatedSchema,
    };
  }

  /**
   * Resolves the schema from the given URI
   *
   * @param path - The path for validation issues
   * @param schemaUri - The schema URI
   * @param context - The `ValidationContext`
   * @returns A promise that resolves with the result object,
   * or `undefined` if the schema could not be resolved
   */
  private static async resolveSchema(
    path: string,
    schemaUri: any,
    context: ValidationContext
  ): Promise<Schema | undefined> {
    if (defined(schemaUri) && typeof schemaUri === "string") {
      const resourceResolver = context.getResourceResolver();
      const schemaBuffer = await resourceResolver.resolveData(schemaUri);
      if (!defined(schemaBuffer)) {
        const schemaUriPath = path + "/schemaUri";
        const message = `The 'schemaUri' is '${schemaUri}' and could not be resolved`;
        const issue = IoValidationIssues.IO_ERROR(schemaUriPath, message);
        context.addIssue(issue);
        return undefined;
      }

      const bom = Buffers.getUnicodeBOMDescription(schemaBuffer);
      if (defined(bom)) {
        const message = `Unexpected BOM in schema JSON buffer: ${bom}`;
        const issue = IoValidationIssues.IO_ERROR(schemaUri, message);
        context.addIssue(issue);
        return undefined;
      }

      const schemaString = schemaBuffer.toString();
      try {
        const resolvedSchema = JSON.parse(schemaString);
        return resolvedSchema;
      } catch (error) {
        //console.log(error);
        const issue = IoValidationIssues.JSON_PARSE_ERROR(path, `${error}`);
        context.addIssue(issue);
        return undefined;
      }
    }
    return undefined;
  }
}
