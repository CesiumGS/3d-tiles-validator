import { defined } from "../base/defined";

import { Validators } from "./Validators";
import { Validator } from "./Validator";
import { ContentData } from "./ContentData";
import { ContentDataEntry } from "./ContentDataEntry";

import { B3dmValidator } from "../tileFormats/B3dmValidator";
import { I3dmValidator } from "../tileFormats/I3dmValidator";
import { PntsValidator } from "../tileFormats/PntsValidator";
import { CmptValidator } from "../tileFormats/CmptValidator";
import { GltfValidator } from "../tileFormats/GltfValidator";

import { Tileset } from "../structure/Tileset";
import { TilesetArchiveValidator } from "./TilesetArchiveValidator";
import { IoValidationIssues } from "../issues/IoValidationIssue";
import { ValidationContext } from "./ValidationContext";
import { ResourceTypes } from "../io/ResourceTypes";

/**
 * A class for managing `Validator` instances that are used for
 * validating the data that is pointed to by a `content.uri`.
 *
 * The only public methods (for now) are `registerDefaults`,
 * which registers all known content data validators, and
 * `findContentDataValidator`, which returns the validator
 * that should be used for a given `ContentData` object.
 *
 * @internal
 */
export class ContentDataValidators {
  /**
   * The list of validators that have been registered.
   */
  private static readonly dataValidators: ContentDataEntry[] = [];

  /**
   * Registers all default content data validators
   */
  static registerDefaults() {
    // The validators will be checked in the order in which they are
    // registered. In the future, there might be a mechanism for
    // 'overriding' a previously registered validator.
    ContentDataValidators.registerByMagic("glTF", new GltfValidator());
    ContentDataValidators.registerByMagic("b3dm", new B3dmValidator());
    ContentDataValidators.registerByMagic("i3dm", new I3dmValidator());
    ContentDataValidators.registerByMagic("cmpt", new CmptValidator());
    ContentDataValidators.registerByMagic("pnts", new PntsValidator());

    // Certain content types are known to be encountered,
    // but are not (yet) validated. These can either be
    // ignored, or cause a warning. In the future, this
    // should be configurable, probably even on a per-type
    // basis, via the command line or a config file
    const ignoreUnhandledContentTypes = false;
    let geomValidator = Validators.createEmptyValidator();
    let vctrValidator = Validators.createEmptyValidator();
    let geojsonValidator = Validators.createEmptyValidator();
    if (!ignoreUnhandledContentTypes) {
      geomValidator = Validators.createContentValidationWarning(
        "Skipping 'geom' validation"
      );
      vctrValidator = Validators.createContentValidationWarning(
        "Skipping 'vctr' validation"
      );
      geojsonValidator = Validators.createContentValidationWarning(
        "Skipping 'geojson' validation"
      );
    }

    ContentDataValidators.registerByMagic("geom", geomValidator);
    ContentDataValidators.registerByMagic("vctr", vctrValidator);
    ContentDataValidators.registerByExtension(".geojson", geojsonValidator);

    ContentDataValidators.registerArchive();
    ContentDataValidators.registerTileset();
    ContentDataValidators.registerGltf();
  }

  private static registerArchive() {
    const predicate = async (contentData: ContentData) =>
      contentData.extension === ".3tz";

    const archiveValidator = new TilesetArchiveValidator();
    const validator = {
      async validateObject(
        inputPath: string,
        input: ContentData,
        context: ValidationContext
      ): Promise<boolean> {
        const resourceResolver = context.getResourceResolver();
        const resolvedUri = resourceResolver.resolveUri(input.uri);
        const result = await archiveValidator.validateObject(
          inputPath,
          resolvedUri,
          context
        );
        return result;
      },
    };

    ContentDataValidators.registerByPredicate(predicate, validator);
  }

  /**
   * Tries to find a data validator that can be used for validating
   * the given content data. If no matching validator can be found,
   * then `undefined` is returned.
   *
   * @param contentData - The `ContentData`
   * @returns The validator, or `undefined`
   */
  static async findContentDataValidator(
    contentData: ContentData
  ): Promise<Validator<ContentData> | undefined> {
    for (const entry of ContentDataValidators.dataValidators) {
      if (await entry.predicate(contentData)) {
        return entry.dataValidator;
      }
    }
    return undefined;
  }

  /**
   * Register a validator that should be used when the content
   * data starts with the given magic string.
   *
   * (This string is currently assumed to have length 4, but
   * this may have to be generalized in the future)
   *
   * @param magic - The magic string
   * @param bufferValidator - The validator for the buffer data
   */
  private static registerByMagic(
    magic: string,
    bufferValidator: Validator<Buffer>
  ) {
    ContentDataValidators.registerByPredicate(
      async (contentData: ContentData) =>
        (await contentData.getMagic()) === magic,
      ContentDataValidators.wrapBufferValidator(bufferValidator)
    );
  }

  /**
   * Register a validator that should be used when the content URI
   * has the given file extension
   *
   * The file extension should include the `"."` dot, and the
   * check for the file extension will be case INsensitive.
   *
   * @param extension - The extension
   * @param bufferValidator - The validator for the buffer data
   */
  private static registerByExtension(
    extension: string,
    bufferValidator: Validator<Buffer>
  ) {
    ContentDataValidators.registerByPredicate(
      async (contentData: ContentData) =>
        contentData.extension === extension.toLowerCase(),
      ContentDataValidators.wrapBufferValidator(bufferValidator)
    );
  }

  /**
   * Register the data validator for (external) tileset files.
   *
   * The condition of whether this validator is used for
   * given content data is that it `isProbablyTileset`.
   */
  private static registerTileset() {
    const predicate = async (contentData: ContentData) =>
      await ContentDataValidators.isProbablyTileset(contentData);
    const externalValidator = Validators.createDefaultTilesetValidator();
    const bufferValidator =
      Validators.parseFromBuffer<Tileset>(externalValidator);
    const contentDataValidator =
      ContentDataValidators.wrapBufferValidator(bufferValidator);
    ContentDataValidators.registerByPredicate(predicate, contentDataValidator);
  }

  /**
   * Register the data validator for glTF files.
   *
   * This refers to JSON files (not GLB files), and checks
   * whether the object that is parsed from the JSON data
   * is probably a glTF asset, as of `isProbablyGltf`.
   */
  private static registerGltf() {
    const predicate = async (contentData: ContentData) =>
      await ContentDataValidators.isProbablyGltf(contentData);
    const bufferValidator = new GltfValidator();
    const contentDataValidator =
      ContentDataValidators.wrapBufferValidator(bufferValidator);
    ContentDataValidators.registerByPredicate(predicate, contentDataValidator);
  }

  /**
   * Returns whether the given content data is probably a tileset.
   *
   * The exact conditions for this method returning `true` are
   * intentionally not specified.
   *
   * @param contentData - The content data
   * @returns Whether the content data is probably a tileset
   */
  static async isProbablyTileset(contentData: ContentData): Promise<boolean> {
    const data = await contentData.getData();
    if (!defined(data)) {
      return false;
    }
    if (!ResourceTypes.isProbablyJson(data!)) {
      return false;
    }
    let parsedObject = undefined;
    try {
      parsedObject = JSON.parse(data!.toString());
    } catch (error) {
      return false;
    }
    if (!defined(parsedObject.asset)) {
      return false;
    }
    return defined(parsedObject.geometricError) || defined(parsedObject.root);
  }

  /**
   * Returns whether the given content data is probably a glTF
   * (not a GLB, but a glTF JSON).
   *
   * The exact conditions for this method returning `true` are
   * intentionally not specified.
   *
   * @param contentData - The content data
   * @returns Whether the content data is probably glTF
   */
  static async isProbablyGltf(contentData: ContentData): Promise<boolean> {
    if (await ContentDataValidators.isProbablyTileset(contentData)) {
      return false;
    }
    const data = await contentData.getData();
    if (!defined(data)) {
      return false;
    }
    if (!ResourceTypes.isProbablyJson(data!)) {
      return false;
    }
    let parsedObject = undefined;
    try {
      parsedObject = JSON.parse(data!.toString());
    } catch (error) {
      return false;
    }
    if (!defined(parsedObject.asset)) {
      return false;
    }
    return true;
  }

  /**
   * Wraps the given validator for `Buffer` objects into one that
   * can be applied to `ContentData` objects, and just applies
   * the given validator to the buffer that is returned by
   * `ContentData#getData`.
   *
   * @param bufferValidator - The validator for `Buffer` objects
   * @returns The validator for `ContentData` objects
   */
  static wrapBufferValidator(
    bufferValidator: Validator<Buffer>
  ): Validator<ContentData> {
    return {
      async validateObject(
        inputPath: string,
        input: ContentData,
        context: ValidationContext
      ): Promise<boolean> {
        const data = await input.getData();
        if (!defined(data)) {
          const message = `Could not resolve ${input.uri}`;
          const issue = IoValidationIssues.IO_WARNING(inputPath, message);
          context.addIssue(issue);
          return true;
        }
        const result = await bufferValidator.validateObject(
          inputPath,
          data!,
          context
        );
        return result;
      },
    };
  }

  /**
   * Registers a data validator that will be used when a
   * `ContentData` matches the given predicate.
   *
   * @param predicate - The predicate
   * @param dataValidator - The data validator
   */
  private static registerByPredicate(
    predicate: (contentData: ContentData) => Promise<boolean>,
    dataValidator: Validator<ContentData>
  ) {
    const entry = {
      predicate: predicate,
      dataValidator: dataValidator,
    };
    ContentDataValidators.dataValidators.push(entry);
  }
}
