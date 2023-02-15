import { defaultValue } from "3d-tiles-tools";

import { ResourceResolver } from "3d-tiles-tools";

import { ValidationIssue } from "./ValidationIssue";
import { ValidationOptions } from "./ValidationOptions";
import { ValidationResult } from "./ValidationResult";

/**
 * A class describing the context in which a validation takes place.
 *
 * This class is used to gather the `ValidationIssue` objects
 * that are created during the validation, and add them to a
 * `ValidationResult`.
 *
 * It also provides a `ResourceResolver` to read resources from URIs,
 * in the respective context. For example: When an external tileset
 * is encountered, a new context is derived from the given one,
 * which resolved resources against the base directory of the
 * external tileset.
 *
 * The different configuration settings that affect the behavior
 * of the validator (for example, whether external resources should
 * be validated) are stored in a `ValidationOptions` object.
 *
 * @internal
 */
export class ValidationContext {
  /**
   * The `ValidationOptions` for the validation process
   */
  private _options: ValidationOptions;

  /**
   * The `ValidationResult` that receives the `ValidationIssue` instances
   */
  private readonly _result: ValidationResult;

  /**
   * The set of extensions that have been found during the validation
   */
  private _extensionsFound: Set<string>;

  /**
   * The `ResourceResolver` that resolves resources that are given
   * as URI strings into Buffer objects, relative to the directory
   * in which the validation started.
   */
  private readonly _resourceResolver: ResourceResolver;

  constructor(resourceResolver: ResourceResolver, options?: ValidationOptions) {
    this._options = defaultValue(options, new ValidationOptions());
    this._result = ValidationResult.create();
    this._resourceResolver = resourceResolver;
    this._extensionsFound = new Set<string>();
  }

  /**
   * Derives a new context from this one.
   *
   * It uses the same `ValidationOptions` as this one. The internal
   * `ResourceResolver` is derived by resolving the given path
   * against the original `ResourceResolver`, yielding one that
   * resolves resources against the resulting path.
   *
   * @param uri - The (usually relative) URI
   * @returns The new instance
   */
  deriveFromUri(uri: string): ValidationContext {
    const derivedResourceResolver = this._resourceResolver.derive(uri);
    return this.deriveFromResourceResolver(derivedResourceResolver);
  }

  /**
   * Derives a new context from this one.
   *
   * It uses the same `ValidationOptions` as this one, but the
   * given resource resolver.
   *
   * @param resourceResolver - The `ResourceResolver`
   * @returns The new instance
   */
  deriveFromResourceResolver(
    resourceResolver: ResourceResolver
  ): ValidationContext {
    const derived = new ValidationContext(resourceResolver, this._options);
    derived._extensionsFound = this._extensionsFound;
    return derived;
  }

  addIssue(issue: ValidationIssue): void {
    this._result.add(issue);
  }

  addExtensionFound(extension: string) {
    this._extensionsFound.add(extension);
  }

  getExtensionsFound(): Set<string> {
    return new Set<string>(this._extensionsFound);
  }

  getResult(): ValidationResult {
    return this._result;
  }

  getResourceResolver(): ResourceResolver {
    return this._resourceResolver;
  }

  getOptions(): ValidationOptions {
    return this._options;
  }
}
