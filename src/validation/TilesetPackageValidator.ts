import path from "path";
import { defined } from "3d-tiles-tools";
import { Buffers } from "3d-tiles-tools";
import { UnzippingResourceResolver } from "3d-tiles-tools";

import { Validators } from "./Validators";
import { Validator } from "./Validator";
import { ValidationContext } from "./ValidationContext";

import { TilesetSourceResourceResolver } from "3d-tiles-tools";

import { ContentValidationIssues } from "../issues/ContentValidationIssues";
import { IoValidationIssues } from "../issues/IoValidationIssue";

import { TilesetSource3tz } from "3d-tiles-tools";
import { TilesetSource3dtiles } from "3d-tiles-tools";
import { TilesetSourceFs } from "3d-tiles-tools";
import { TilesetSource } from "3d-tiles-tools";
import { ArchiveValidation3tz } from "../archives/ArchiveValidation3tz";

/**
 * An implementation of a validator that validates a `TilesetSource`.
 *
 * The actual validation function is `validatePackageFile`.
 *
 * This class also implements the `Validator` interface, so that
 * instances of it can be used when the tile content is a
 * tileset package. In this case, the validated type is `string`, where
 * this string is the 'resolvedUri' that points to a file in the
 * local file system.
 *
 * @internal
 */
export class TilesetPackageValidator implements Validator<string> {
  /**
   * Implementation of the `Validator` interface. This validates
   * the given 'resolvedUri' string, assuming that it is a full
   * path to a tileset package in the local file system.
   *
   * @param uri - The (usually relative) URI of the package
   * @param resolvedUri - The resolved URI, which is the full URI
   * of the package in the local file system.
   * @param context - The `ValidationContext`
   * @returns A promise that is fulfilled when the validation is finished
   * and indicates whether the object was valid or not.
   */
  async validateObject(
    uri: string,
    resolvedUri: string,
    context: ValidationContext
  ): Promise<boolean> {
    //console.log("TilesetPackageValidator resolvedUri is " + resolvedUri);
    const isContent = true;
    const result = TilesetPackageValidator.validatePackageFileInternal(
      resolvedUri,
      isContent,
      context
    );
    return result;
  }

  /**
   * Validates the tileset that is contained in the package that is
   * pointed to by the given URI (assuming that it is a file in
   * the local file system).
   *
   * @param uri - The full URI of the package file
   * @param context - The `ValidationContext`
   * @returns A promise that indicates whether the package contained
   * a valid tileset.
   */
  static async validatePackageFile(uri: string, context: ValidationContext) {
    const isContent = false;
    const result = TilesetPackageValidator.validatePackageFileInternal(
      uri,
      isContent,
      context
    );
    return result;
  }

  /**
   * Validates the tileset that is contained in the package that is
   * pointed to by the given URI (assuming that it is a file in
   * the local file system).
   *
   * @param uri - The full URI of the package file
   * @param isContent - Whether the given package was found as a tile
   * content. If this is the case, then the issues that are found
   * in the package will be summarized in a `CONTENT_VALIDATION_`
   * issue. Otherwise, they will be added directly to the given context.
   * @param context - The `ValidationContext`
   * @returns A promise that indicates whether the package contained
   * a valid tileset.
   */
  private static async validatePackageFileInternal(
    uri: string,
    isContent: boolean,
    context: ValidationContext
  ): Promise<boolean> {
    // Create the tileset source for the package from the given URI
    // (i.e. the full package file name). If the source cannot
    // be opened, bail out with an IO_WARNING.
    let tilesetSource = undefined;
    const extension = path.extname(uri).toLowerCase();
    if (extension === ".3tz") {
      tilesetSource = new TilesetSource3tz();
    } else if (extension === ".3dtiles") {
      tilesetSource = new TilesetSource3dtiles();
    } else if (extension === "") {
      tilesetSource = new TilesetSourceFs();
    } else {
      const message = `Could not create tileset source from ${uri}: No known file extension. `;
      const issue = IoValidationIssues.IO_WARNING(uri, message);
      context.addIssue(issue);
      return true;
    }
    tilesetSource.open(uri);
    const result = await TilesetPackageValidator.validatePackageInternal(
      uri,
      tilesetSource,
      isContent,
      context
    );
    tilesetSource.close();
    return result;
  }

  /**
   * Validates the tileset that is contained in the given `TilesetSource`.
   *
   * The caller is responsible for calling 'open' on the source before
   * passing it to this method, and 'close' after this method returns.
   *
   * @param uri - The full URI of the package file
   * @param tilesetSource - The `TilesetSource` that was created from
   * the package file
   * @param isContent - Whether the given package was found as a tile
   * content. If this is the case, then the issues that are found
   * in the package will be summarized in a `CONTENT_VALIDATION_`
   * issue. Otherwise, they will be added directly to the given context.
   * @param context - The `ValidationContext`
   * @returns A promise that indicates whether the package contained
   * a valid tileset.
   */
  private static async validatePackageInternal(
    uri: string,
    tilesetSource: TilesetSource,
    isContent: boolean,
    context: ValidationContext
  ): Promise<boolean> {
    // If the package is a 3TZ package, then perform the extended
    // validation of the 3TZ index part, using the ("legacy") 3TZ
    // package validation
    if (tilesetSource instanceof TilesetSource3tz) {
      const tilesetSource3tz = tilesetSource as TilesetSource3tz;
      const zipIndex = tilesetSource3tz.getZipIndex();
      if (defined(zipIndex)) {
        try {
          const indexValid = await ArchiveValidation3tz.validateIndex(
            zipIndex,
            uri,
            false
          );
          if (!indexValid) {
            const message = `The 3TZ index is not valid`;
            const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
              uri,
              message
            );
            context.addIssue(issue);
            return false;
          }
        } catch (error) {
          const message = `Error while validating 3TZ index: ${error}.`;
          const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
            uri,
            message
          );
          context.addIssue(issue);
          return false;
        }
      }
    }

    // Create the `TilesetSourceResourceResolver` from the package,
    // and obtain the data for the `tileset.json` file.
    // This has to be present according to the 3TZ specification.
    const plainPackageResourceResolver = new TilesetSourceResourceResolver(
      "./",
      tilesetSource
    );
    const packageResourceResolver = new UnzippingResourceResolver(
      plainPackageResourceResolver
    );
    const tilesetJsonBuffer = await packageResourceResolver.resolveData(
      "tileset.json"
    );
    if (!defined(tilesetJsonBuffer)) {
      const message = `Could not read 'tileset.json' from package ${uri}.`;
      const issue = IoValidationIssues.IO_ERROR(uri, message);
      context.addIssue(issue);
      return false;
    }

    const bom = Buffers.getUnicodeBOMDescription(tilesetJsonBuffer);
    if (defined(bom)) {
      const message = `Unexpected BOM in subtree JSON buffer: ${bom}`;
      const issue = IoValidationIssues.IO_ERROR(uri, message);
      context.addIssue(issue);
      return false;
    }

    // Parse the tileset object from the JSON data
    let tileset = undefined;
    try {
      tileset = JSON.parse(tilesetJsonBuffer.toString());
    } catch (error) {
      const message =
        `Could not parse tileset JSON from 'tileset.json' ` +
        `data in package ${uri}.`;
      const issue = IoValidationIssues.IO_ERROR(uri, message);
      context.addIssue(issue);
      return false;
    }

    // Open a new context for collecting the issues that
    // are caused by the tileset, and validate the
    // tileset using a default tileset validator.
    const derivedContext = context.deriveFromResourceResolver(
      uri,
      packageResourceResolver
    );
    const tilesetValidator = Validators.createDefaultTilesetValidator();
    const result = await tilesetValidator.validateObject(
      uri + "/tileset.json",
      tileset,
      derivedContext
    );
    const derivedResult = derivedContext.getResult();

    if (isContent) {
      const issue = ContentValidationIssues.createForContent(
        uri,
        derivedResult
      );
      if (issue) {
        context.addIssue(issue);
      }
    } else {
      for (const innerIssue of derivedResult.issues) {
        context.addIssue(innerIssue);
      }
    }

    return result;
  }
}
