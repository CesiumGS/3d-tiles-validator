import path from "path";
import { defined } from "../base/defined";

import { Validators } from "./Validators";
import { Validator } from "./Validator";
import { ValidationContext } from "./ValidationContext";

import { ArchiveResourceResolver } from "../io/ArchiveResourceResolver";

import { ContentValidationIssues } from "../issues/ContentValidationIssues";
import { IoValidationIssues } from "../issues/IoValidationIssue";

import { TilesetArchive3tz } from "../archives/TilesetArchive3tz";
import { ArchiveValidation3tz } from "../archives/ArchiveValidation3tz";
import { TilesetArchive3dtiles } from "../archives/TilesetArchive3dtiles";
import { TilesetArchiveFs } from "../archives/TilesetArchiveFs";
import { TilesetArchive } from "../archives/TilesetArchive";

/**
 * An implementation of a validator that validates a tileset
 * archive (or "tileset package", using the new naming)
 *
 * The validated type here is `string`, assuming that this
 * string is the 'resolvedUri' that points to a file in the
 * local file system.
 *
 * @internal
 */
export class TilesetArchiveValidator implements Validator<string> {
  /**
   * Implementation of the `Validator` interface. This validates
   * the given 'resolvedUri' string, assuming that it is a full
   * path to a tileset archive in the local file system.
   *
   * @param uri - The (usually relative) URI of the archive
   * @param resolvedUri - The resolved URI, which is the full URI
   * of the archive in the local file system.
   * @param context - The `ValidationContext`
   * @returns A promise that is fulfilled when the validation is finished
   * and indicates whether the object was valid or not.
   */
  async validateObject(
    uri: string,
    resolvedUri: string,
    context: ValidationContext
  ): Promise<boolean> {
    //console.log("TilesetArchiveValidator resolvedUri is " + resolvedUri);
    const isContent = true;
    const result = TilesetArchiveValidator.validateArchiveFileInternal(
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
   * @param uri - The full URI of the archive file
   * @param context - The `ValidationContext`
   * @returns A promise that indicates whether the archive contained
   * a valid tileset.
   */
  static async validateArchiveFile(uri: string, context: ValidationContext) {
    const isContent = false;
    const result = TilesetArchiveValidator.validateArchiveFileInternal(
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
   * @param uri - The full URI of the archive file
   * @param isContent - Whether the given archive was found as a tile
   * content. If this is the case, then the issues that are found
   * in the archive will be summarized in a `CONTENT_VALIDATION_`
   * issue. Otherwise, they will be added directly to the given context.
   * @param context - The `ValidationContext`
   * @returns A promise that indicates whether the archive contained
   * a valid tileset.
   */
  private static async validateArchiveFileInternal(
    uri: string,
    isContent: boolean,
    context: ValidationContext
  ): Promise<boolean> {
    // Create the archive from the given URI (i.e. the
    // full archive file name). If the archive cannot
    // be opened, bail out with an IO_WARNING.
    let archive = undefined;
    let archive3tz = undefined;
    const extension = path.extname(uri).toLowerCase();
    if (extension === ".3tz") {
      archive3tz = new TilesetArchive3tz();
      archive = archive3tz;
    } else if (extension === ".3dtiles") {
      archive = new TilesetArchive3dtiles();
    } else if (extension === "") {
      archive = new TilesetArchiveFs();
    } else {
      const message = `Could not create archive from ${uri}: No known file extension. `;
      const issue = IoValidationIssues.IO_WARNING(uri, message);
      context.addIssue(issue);
      return true;
    }
    archive.open(uri);
    const result = await TilesetArchiveValidator.validateArchiveInternal(
      uri,
      archive,
      isContent,
      context
    );
    archive.close();
    return result;
  }

  /**
   * Validates the tileset that is contained in the given `TilesetArchive`.
   *
   * The caller is responsible for calling 'open' on the archive before
   * passing it to this method, and 'close' after this method returns.
   *
   * @param uri - The full URI of the archive file
   * @param archive - The `TilesetArchive`
   * @param isContent - Whether the given archive was found as a tile
   * content. If this is the case, then the issues that are found
   * in the archive will be summarized in a `CONTENT_VALIDATION_`
   * issue. Otherwise, they will be added directly to the given context.
   * @param context - The `ValidationContext`
   * @returns A promise that indicates whether the archive contained
   * a valid tileset.
   */
  private static async validateArchiveInternal(
    uri: string,
    archive: TilesetArchive,
    isContent: boolean,
    context: ValidationContext
  ): Promise<boolean> {
    // If the archive is a 3TZ archive, then perform the extended
    // validation of the 3TZ index part, using the ("legacy") 3TZ
    // archive validation
    if (archive instanceof TilesetArchive3tz) {
      const archive3tz = archive as TilesetArchive3tz;
      const zipIndex = archive3tz.getZipIndex();
      if (defined(zipIndex)) {
        try {
          const indexValid = await ArchiveValidation3tz.validateIndex(
            zipIndex!,
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
            archive.close();
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

    // Create the `ArchiveResourceResolver` from the archive,
    // and obtain the data for the `tileset.json` file.
    // This has to be present according to the 3TZ specification.
    const archiveResourceResolver = new ArchiveResourceResolver(
      "./",
      uri,
      archive
    );
    const tilesetJsonBuffer = await archiveResourceResolver.resolveData(
      "tileset.json"
    );
    if (!defined(tilesetJsonBuffer)) {
      const message = `Could not read 'tileset.json' from archive ${uri}.`;
      const issue = IoValidationIssues.IO_ERROR(uri, message);
      context.addIssue(issue);
      return false;
    }

    // Parse the tileset object from the JSON data
    let tileset = undefined;
    try {
      tileset = JSON.parse(tilesetJsonBuffer!.toString());
    } catch (error) {
      const message =
        `Could not parse tileset JSON from 'tileset.json' ` +
        `data in archive ${uri}.`;
      const issue = IoValidationIssues.IO_ERROR(uri, message);
      context.addIssue(issue);
      return false;
    }

    // Open a new context for collecting the issues that
    // are caused by the tileset, and validate the
    // tileset using a default tileset validator.
    const derivedContext = context.deriveFromResourceResolver(
      archiveResourceResolver
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
