import fs from "fs";

import { defined } from "../base/defined";

import Ajv2020 from "ajv/dist/2020";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const addFormats = require("ajv-formats-draft2019");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ajvErrors = require("ajv-errors");
import { ErrorObject } from "ajv";

import { Validator } from "../validation/Validator";
import { ValidationContext } from "../validation/ValidationContext";
import { ValidationIssue } from "../validation/ValidationIssue";

import { JsonValidationIssues } from "../issues/JsonValidationIssues";

export class JsonSchemaValidatorAjv implements Validator<any> {
  private _ajv: Ajv2020;
  private _schemaIdentifier: string;

  constructor(schemaIdentifier: string) {
    this._ajv = new Ajv2020({
      strictTypes: false,
      allErrors: true,
    });
    this._schemaIdentifier = schemaIdentifier;
    addFormats(this._ajv);
    ajvErrors(this._ajv, {});
  }

  addSchema(name: string, schemaPath: string, errorMessage?: any): void {
    try {
      const buffer = fs.readFileSync(schemaPath);
      const schema = JSON.parse(buffer.toString());
      if (defined(errorMessage)) {
        schema.errorMessage = errorMessage;
      }
      this._ajv.addSchema(schema, name);
    } catch (error) {
      console.error(error);
    }
  }

  private createIssueFromAjvError(
    schemaIdentifier: string,
    error: ErrorObject
  ): ValidationIssue {
    const path = error.instancePath;
    let name = schemaIdentifier;
    if (path.length !== 0) {
      name += path;
    }
    const message = name + " " + error.message;
    const issue = JsonValidationIssues.SCHEMA_ERROR(path, message);
    return issue;
  }

  async validateObject(
    input: any,
    context: ValidationContext
  ): Promise<boolean> {
    const validate = this._ajv.getSchema(this._schemaIdentifier);
    if (validate) {
      const valid = validate(input);
      if (!valid) {
        const errors = validate.errors ? validate.errors : [];
        //console.log(errors);
        for (const error of errors) {
          const issue = this.createIssueFromAjvError(
            this._schemaIdentifier,
            error
          );
          context.addIssue(issue);
        }
        return false;
      }
    }
    return true;
  }
}
