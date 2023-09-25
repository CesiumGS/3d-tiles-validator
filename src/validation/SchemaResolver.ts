import { defined } from "3d-tiles-tools";
import { Buffers } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";
import { ValidationContext } from "./ValidationContext";
import { IoValidationIssues } from "../issues/IoValidationIssue";

/**
 * Internal utility class for resolving a metadata `Schema` object.
 * 
 * This receives the `schema` and `schemaUri` (for example, 
 * from a `tileset` object), and returns the resulting 
 * schema, resolving the `schemaUri` if necessary.
 * 
 * @internal 
 */
export class SchemaResolver {
  /**
   * Resolves the schema for the given object.
   *
   * The result will be an object with the following properties:
   *
   * `hasSchemaDefinition`: This is `true` if there either was a
   * `schema` or a `schemaUri`
   *
   * `schema`: This is either the `schema`, or the schema that was 
   * read from the `schemaUri`. If the latter could not be resolved, 
   * then `schema` will be `undefined`.
   *
   * @param path - The path for validation issues
   * @param schema - The schema
   * @param schemaUri - The schema URI
   * @param context - The `ValidationContext`
   * @returns A promise that resolves with the result object
   */
  static async resolveSchema(
    path: string,
    schema: any, 
    schemaUri: any,
    context: ValidationContext
  ): Promise<{ hasSchemaDefinition: boolean; schema?: Schema }> {
    if (defined(schema) && typeof schema === "object") {
      return {
        hasSchemaDefinition: true,
        schema: schema,
      };
    }
    if (defined(schemaUri) && typeof schemaUri === "string") {
      const resourceResolver = context.getResourceResolver();
      const schemaBuffer = await resourceResolver.resolveData(schemaUri);
      if (!defined(schemaBuffer)) {
        const schemaUriPath = path + "/schemaUri";
        const message = `The 'schemaUri' is '${schemaUri}' and could not be resolved`;
        const issue = IoValidationIssues.IO_ERROR(schemaUriPath, message);
        context.addIssue(issue);
        return {
          hasSchemaDefinition: true,
          schema: undefined,
        };
      }

      const bom = Buffers.getUnicodeBOMDescription(schemaBuffer);
      if (defined(bom)) {
        const message = `Unexpected BOM in schema JSON buffer: ${bom}`;
        const issue = IoValidationIssues.IO_ERROR(schemaUri, message);
        context.addIssue(issue);
        return {
          hasSchemaDefinition: true,
          schema: undefined,
        };
      }

      const schemaString = schemaBuffer.toString();
      try {
        const resolvedSchema = JSON.parse(schemaString);
        return {
          hasSchemaDefinition: true,
          schema: resolvedSchema,
        };
      } catch (error) {
        //console.log(error);
        const issue = IoValidationIssues.JSON_PARSE_ERROR(path, "" + error);
        context.addIssue(issue);
        return {
          hasSchemaDefinition: true,
          schema: undefined,
        };
      }
    }
    return {
      hasSchemaDefinition: false,
      schema: undefined,
    };
  }

}