import { ValidationContext } from "./ValidationContext";

import { JsonValidationIssues } from "../issues/JsonValidationIssues";
import { BasicValidator } from "./BasicValidator";

/**
 * A class for the validation of strings that must follow a
 * certain pattern.
 *
 * @internal
 */
export class StringValidator {
  /**
   * Validate that the given string is a valid identifier string,
   * as defined in the 3D Metadata Specification.
   *
   * If the given value is not defined, then a `PROPERTY_MISSING`
   * validation issue will be added to the given validation
   * context, and `false` is returned.
   *
   * If the given value is not a string, then a `TYPE_MISMATCH`
   * validation issue will be added to the given validation
   * context, and `false` is returned.
   *
   * If the given string does not match the regex for a valid
   * identifier string, then a `STRING_PATTERN_MISMATCH`
   * validation issue will be added to the given validation
   * context, and `false` is returned.
   *
   * Otherwise, `true` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value is an identifier string
   */
  static validateIdentifierString(
    path: string,
    name: string,
    value: string,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateString(path, name, value, context)) {
      return false;
    }
    const idRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!idRegex.test(value)) {
      const issue = JsonValidationIssues.STRING_PATTERN_MISMATCH(
        path,
        name,
        value,
        idRegex.toString()
      );
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Validate that the given string is a valid ISO8601 string.
   *
   * If the given value is not defined, then a `PROPERTY_MISSING`
   * validation issue will be added to the given validation
   * context, and `false` is returned.
   *
   * If the given value is not a string, then a `TYPE_MISMATCH`
   * validation issue will be added to the given validation
   * context, and `false` is returned.
   *
   * If the given string is not a valid ISO8601 string, then a
   * `STRING_PATTERN_MISMATCH` validation issue will be added
   * to the given validation context, and `false` is returned.
   *
   * Otherwise, `true` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value is an ISO8601 string
   */
  static validateIso8601String(
    path: string,
    name: string,
    value: string,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateString(path, name, value, context)) {
      return false;
    }
    if (!StringValidator.isValidIso8601String(value)) {
      const message =
        `The string property ${name} must be a valid ISO8601 string, ` +
        `but is '${value}'`;
      const issue = JsonValidationIssues.STRING_VALUE_INVALID(path, message);
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Returns whether the given string is a valid ISO8601 string.
   *
   * Extracted from the "validator.js" library.
   *
   * @param str - The string
   * @returns Whether the string is a valid ISO8601 string
   */
  private static isValidIso8601String(str: string) {
    // The following is extracted from the "validator.js" library, at
    // https://github.com/validatorjs/validator.js/blob/
    //   f54599c8fbd43b1febb2cbc18190107417fbdd5e/src/lib/isISO8601.js
    // (with minor adjustments for linting)
    //
    // The copyright header of this library:
    //
    // Copyright (c) 2018 Chris O'Hara <cohara87@gmail.com>
    //
    // Permission is hereby granted, free of charge, to any person obtaining
    // a copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to
    // permit persons to whom the Software is furnished to do so, subject to
    // the following conditions:
    //
    // The above copyright notice and this permission notice shall be
    // included in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    // EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    // NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    // LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    // OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    // WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    // from http://goo.gl/0ejHHW
    const iso8601 =
      /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
    const check = iso8601.test(str);
    if (!check) {
      return false;
    }

    // str must have passed the ISO8601 check
    // this check is meant to catch invalid dates
    // like 2009-02-31
    // first check for ordinal dates
    const ordinalMatch = str.match(/^(\d{4})-?(\d{3})([ T]{1}\.*|$)/);
    if (ordinalMatch) {
      const oYear = Number(ordinalMatch[1]);
      const oDay = Number(ordinalMatch[2]);
      // if is leap year
      if ((oYear % 4 === 0 && oYear % 100 !== 0) || oYear % 400 === 0)
        return oDay <= 366;
      return oDay <= 365;
    }
    const matches = str.match(/(\d{4})-?(\d{0,2})-?(\d*)/);
    if (!matches) {
      return false;
    }
    const match = matches.map(Number);
    const year = match[1];
    const month = match[2];
    const day = match[3];
    const monthString = month ? `0${month}`.slice(-2) : month;
    const dayString = day ? `0${day}`.slice(-2) : day;

    // create a date object and compare
    const d = new Date(`${year}-${monthString || "01"}-${dayString || "01"}`);
    if (month && day) {
      return (
        d.getUTCFullYear() === year &&
        d.getUTCMonth() + 1 === month &&
        d.getUTCDate() === day
      );
    }
    return true;
  }
}
