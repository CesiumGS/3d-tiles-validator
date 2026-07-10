import path from "path";

import { defaultValue } from "3d-tiles-tools";

import { ResourceResolver } from "3d-tiles-tools";

import { ValidationIssue } from "./ValidationIssue";
import { ValidationOptions } from "./ValidationOptions";
import { ValidationResult } from "./ValidationResult";
import { IssueCounters } from "./IssueCounters";

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

  /**
   * The base URI that URIs should be resolved against in
   * this context
   */
  private readonly _baseUri;

  /**
   * The set of absolute URIs of tilesets that are currently being
   * validated. When an external tileset is encountered, then its
   * absolute URI is added to this set.
   */
  private _activeTilesetUris: Set<string>;

  /**
   * The set of schema objects that will be used for validating
   * metadata class property semantics, in the
   * `ClassPropertySemanticsValidator`.
   */
  private _semanticMatchingSchemas: Set<any>;

  /**
   * Creates a new instance
   *
   * @param baseUri - The URI against which resources are resolved
   * @param resourceResolver - The resource resolver
   * @param options - The optional ValidationOptions
   */
  constructor(
    baseUri: string,
    resourceResolver: ResourceResolver,
    options?: ValidationOptions
  ) {
    this._options = defaultValue(options, new ValidationOptions());
    this._baseUri = baseUri;
    this._result = ValidationResult.create();
    this._resourceResolver = resourceResolver;
    this._extensionsFound = new Set<string>();
    this._activeTilesetUris = new Set<string>();
    this._semanticMatchingSchemas = new Set<any>();
  }

  /**
   * Derives a new context from this one.
   *
   * It uses the same `ValidationOptions` as this one. The internal
   * `ResourceResolver` is derived by resolving the given path
   * against the original `ResourceResolver`, yielding one that
   * resolves resources against the resulting path.
   *
   * The returned context will initially not have any records of
   * extensions that are 'found' (i.e. `getExtensionsFound` will
   * be empty). Depending on the purpose of the derived context,
   * and details about the validation of 'used' extensions
   * (see https://github.com/CesiumGS/3d-tiles-validator/issues/231 ),
   * the caller may decide to add the `getExtensionsUsed` of the
   * derived context to the context that it was derived from.
   *
   * @param uri - The (usually relative) URI
   * @returns The new instance
   */
  deriveFromUri(uri: string): ValidationContext {
    const derivedResourceResolver = this._resourceResolver.derive(uri);
    const derivedBaseUri = path.join(this._baseUri, decodeURIComponent(uri));
    const derived = new ValidationContext(
      derivedBaseUri,
      derivedResourceResolver,
      this._options
    );
    derived._extensionsFound = new Set<string>();
    derived._activeTilesetUris = this._activeTilesetUris;
    derived._semanticMatchingSchemas = this._semanticMatchingSchemas;
    return derived;
  }

  /**
   * Derives a new context from this one.
   *
   * It uses the same `ValidationOptions` as this one, with
   * a base URI that is derived by resolving the given URI
   * against the current base URI, and uses the given
   * `ResourceResolver`.
   *
   * The returned context will initially not have any records of
   * extensions that are 'found' (i.e. `getExtensionsFound` will
   * be empty). Depending on the purpose of the derived context,
   * and details about the validation of 'used' extensions
   * (see https://github.com/CesiumGS/3d-tiles-validator/issues/231 ),
   * the caller may decide to add the `getExtensionsUsed` of the
   * derived context to the context that it was derived from.
   *
   * @param uri - The (usually relative) URI
   * @param resourceResolver - The resource resolver
   * @returns The new instance
   */
  deriveFromResourceResolver(
    uri: string,
    resourceResolver: ResourceResolver
  ): ValidationContext {
    const derivedBaseUri = path.join(this._baseUri, decodeURIComponent(uri));
    const derived = new ValidationContext(
      derivedBaseUri,
      resourceResolver,
      this._options
    );
    derived._extensionsFound = new Set<string>();
    derived._activeTilesetUris = this._activeTilesetUris;
    derived._semanticMatchingSchemas = this._semanticMatchingSchemas;
    return derived;
  }

  /**
   * Adds the given issue to the result that is returned with 'getResult'
   *
   * @param issue - The issue
   */
  addIssue(issue: ValidationIssue): void {
    this._result.add(issue);
  }

  /**
   * Add the given name to the set of extensions that have been found.
   *
   * These are the extensions that actually appear in the tileset
   * itself or one of its external tilesets. In some cases - like
   * extensions that only allow specific content types, like
   * 3DTILES_content_gltf - the extension is "found" when the
   * respective content type is encountered.
   *
   * Each extension that is "found" should be declared in the
   * 'extensionsUsed' as well.
   *
   * @param extension - The extension name
   */
  addExtensionFound(extension: string) {
    this._extensionsFound.add(extension);
  }

  /**
   * Returns a new set that contains the names of all extensions that
   * have been found.
   *
   * See 'addExtensionFound' for details.
   *
   * @returns - The found extensions
   */
  getExtensionsFound(): Set<string> {
    return new Set<string>(this._extensionsFound);
  }

  addOmittedIssueCounters(issueCounters: IssueCounters) {
    this._result.addOmittedIssueCounters(issueCounters);
  }
  getOmittedIssueCounters(): IssueCounters {
    return this._result.getOmittedIssueCounters();
  }

  /**
   * Returns a reference to the current validation result.
   *
   * Clients should not attempt to modify this result in any way.
   * It is only intended for finally gathering the result and
   * serializing it for console- or report file output.
   *
   * @returns - The validation result
   */
  getResult(): ValidationResult {
    return this._result;
  }

  /**
   * Returns the resource resolver that is used in this context.
   *
   * This will resolve resources via (relative) URIs, and these
   * URIS will be resolved against the base URI of this context.
   * For derived contexts (for example, ones that have been created
   * for external tilesets), the resolver will resolve the relative
   * URIs from the external tileset against the directory that the
   * external tileset JSON was contained in.
   *
   * @returns - The resource resolver
   */
  getResourceResolver(): ResourceResolver {
    return this._resourceResolver;
  }

  /**
   * Resolves the given URI against the base URI of this context.
   *
   * @param uri - The relative URI
   * @returns - The resolved URI
   */
  resolveUri(uri: string): string {
    let resolved = path.resolve(this._baseUri, decodeURIComponent(uri));
    resolved = resolved.replace(/\\/g, "/");
    return resolved;
  }

  /**
   * Add the given URI to the set of tileset URIs that are active.
   *
   * This is mainly intended for detecting circular references of
   * external tilesets. When an external tileset is encountered,
   * then its URI is resolved (using 'resolveUri') and added via
   * this method. If the same URI is encountered again as a circular
   * reference, then this will cause a validation error.
   *
   * @param uri - The tileset URI
   */
  addActiveTilesetUri(uri: string) {
    this._activeTilesetUris.add(uri);
  }

  /**
   * Remove the given URI from the set of tileset URIs that are active.
   *
   * See 'addActiveTilesetUri' for details.
   *
   * @param uri - The URI
   */
  removeActiveTilesetUri(uri: string) {
    this._activeTilesetUris.delete(uri);
  }

  /**
   * Returns whether the given tileset URI is currently active.
   *
   * See 'addActiveTilesetUri' for details.
   *
   * @param uri - The URI
   * @returns - Whether the URI is currently active
   */
  isActiveTilesetUri(uri: string): boolean {
    return this._activeTilesetUris.has(uri);
  }

  /**
   * Add the given schema to the schemas that define metadata semantics.
   *
   * The given object will usually be an actual 'Schema' object. The only
   * deviation from schema objects is that the given object may define
   * component type options, like
   * `componentType: "UINT(8|16|32|64)"`
   *
   * The given schema will be used for validating the semantics of metadata
   * class properties, in the `ClassPropertySemanticsValidator`.
   *
   * @param schema - The schema
   */
  addSemanticMatchingSchema(schema: any) {
    this._semanticMatchingSchemas.add(schema);
  }

  /**
   * Returns a new array containing all schemas that define metadata semantics.
   *
   * See 'addSemanticMatchingSchema' for details.
   *
   * @returns - The semantic matching schemas
   */
  getSemanticMatchingSchemas(): any[] {
    return [...this._semanticMatchingSchemas];
  }

  /**
   * Returns the validation options of this context.
   *
   * This is used internally. Clients should not attempt to modify
   * the returned options.
   *
   * @returns - The validation options
   */
  getOptions(): ValidationOptions {
    return this._options;
  }
}
