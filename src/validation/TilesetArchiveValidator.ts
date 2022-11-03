import { defined } from "../base/defined";

import { Validators } from "./Validators";
import { Validator } from "./Validator";
import { ValidationContext } from "./ValidationContext";

import { ArchiveResourceResolver } from "../io/ArchiveResourceResolver";

import { ContentValidationIssues } from "../issues/ContentValidationIssues";
import { IoValidationIssues } from "../issues/IoValidationIssue";

/**
 */
export class TilesetArchiveValidator implements Validator<Buffer> {
  async validateObject(
    uri: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const baseResourceResolver = context.getResourceResolver();
    const fullArchiveFileName = baseResourceResolver.resolveUri(uri);
    console.log("fullArchiveFileName is " + fullArchiveFileName);
    const archiveResourceResolver = new ArchiveResourceResolver(
      "./",
      fullArchiveFileName,
      undefined
    );
    // TODO_ARCHIVE_EXPERIMENTS The 'extensionsFound' from the
    // derived resource resolver will get lost here!
    const derivedContext = new ValidationContext(archiveResourceResolver);
    const tilesetValidator = Validators.createDefaultTilesetValidator();
    const tilesetJsonBuffer = await archiveResourceResolver.resolve(
      "tileset.json"
    );
    if (!defined(tilesetJsonBuffer)) {
      const message = `Could not read 'tileset.json' from archive ${uri} (full archive file name is ${fullArchiveFileName})`;
      const issue = IoValidationIssues.IO_ERROR(uri, message);
      context.addIssue(issue);
      return false;
    }
    try {
      const tileset = JSON.parse(tilesetJsonBuffer!.toString());
      const result = await tilesetValidator.validateObject(
        uri + "/tileset.json",
        tileset,
        derivedContext
      );
      const derivedResult = derivedContext.getResult();
      const issue = ContentValidationIssues.createFrom(uri, derivedResult);
      if (issue) {
        context.addIssue(issue);
      }
      return result;
    } catch (error) {
      const message = `Could not parse tileset JSON from 'tileset.json' data in archive ${uri} (full archive file name is ${fullArchiveFileName})`;
      const issue = IoValidationIssues.IO_ERROR(uri, message);
      context.addIssue(issue);
      return false;
    }
  }
}
