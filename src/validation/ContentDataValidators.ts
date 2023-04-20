import { ContentDataTypeRegistry, defined } from "3d-tiles-tools";

import { Validators } from "./Validators";
import { Validator } from "./Validator";
import { ValidationContext } from "./ValidationContext";
import { ContentData } from "3d-tiles-tools";
import { TilesetPackageValidator } from "./TilesetPackageValidator";

import { B3dmValidator } from "../tileFormats/B3dmValidator";
import { I3dmValidator } from "../tileFormats/I3dmValidator";
import { PntsValidator } from "../tileFormats/PntsValidator";
import { CmptValidator } from "../tileFormats/CmptValidator";
import { GltfValidator } from "../tileFormats/GltfValidator";

import { Tileset } from "3d-tiles-tools";

import { IoValidationIssues } from "../issues/IoValidationIssue";

/**
 * A class for managing `Validator` instances that are used for
 * validating the data that is pointed to by a `content.uri`.
 *
 * The only public method (for now) is `findContentDataValidator`,
 * which returns the validator that should be used for a given
 * `ContentData` object.
 *
 * @internal
 */
export class ContentDataValidators {
  /**
   * The validators that have been registered.
   *
   * See `registerDefaults` for details.
   */
  private static readonly dataValidators: {
    [key: string]: Validator<ContentData>;
  } = {};

  /**
   * Whether the default content data validators have already
   * been registered by calling 'registerDefaults'
   *
   * Note: This could be solved with a static initializer block, but the
   * unclear initialization order of the classes would make this brittle
   */
  private static _registeredDefaults = false;

  /**
   * Registers all default content data validators
   */
  private static registerDefaults() {
    if (ContentDataValidators._registeredDefaults) {
      return;
    }

    // The keys that are used here are the strings that are
    // returned by the `ContentDataTypeRegistry`, for a
    // given `ContentData`.
    // THESE STRINGS ARE NOT SPECIFIED.
    // Using them here is relying on an implementation
    // detail. Whether or not these strings should be
    // public and/or specified has to be decided.

    ContentDataValidators.registerForBuffer(
      "CONTENT_TYPE_GLB",
      new GltfValidator()
    );

    ContentDataValidators.registerForBuffer(
      "CONTENT_TYPE_B3DM",
      new B3dmValidator()
    );

    ContentDataValidators.registerForBuffer(
      "CONTENT_TYPE_I3DM",
      new I3dmValidator()
    );

    ContentDataValidators.registerForBuffer(
      "CONTENT_TYPE_CMPT",
      new CmptValidator()
    );

    ContentDataValidators.registerForBuffer(
      "CONTENT_TYPE_PNTS",
      new PntsValidator()
    );

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

    ContentDataValidators.register("CONTENT_TYPE_GEOM", geomValidator);
    ContentDataValidators.register("CONTENT_TYPE_VCTR", vctrValidator);
    ContentDataValidators.register("CONTENT_TYPE_GEOJSON", geojsonValidator);

    ContentDataValidators.register(
      "CONTENT_TYPE_3TZ",
      ContentDataValidators.createPackageValidator()
    );

    ContentDataValidators.register(
      "CONTENT_TYPE_TILESET",
      ContentDataValidators.createTilesetValidator()
    );
    ContentDataValidators.register(
      "CONTENT_TYPE_GLTF",
      ContentDataValidators.createGltfJsonValidator()
    );

    ContentDataValidators._registeredDefaults = true;
  }

  /**
   * Creates a validator for content data that refers to a 3TZ package.
   *
   * This takes the contentData.uri, resolves it (to obtain an absolute URI),
   * and assumes that this URI is a path in the local file system, which
   * is then passed to the `TilesetPackageValidator`
   *
   * @returns The validator
   */
  private static createPackageValidator(): Validator<ContentData> {
    const packageValidator = new TilesetPackageValidator();
    const validator = {
      async validateObject(
        inputPath: string,
        input: ContentData,
        context: ValidationContext
      ): Promise<boolean> {
        const resolvedUri = context.resolveUri(input.uri);
        const result = await packageValidator.validateObject(
          inputPath,
          resolvedUri,
          context
        );
        return result;
      },
    };
    return validator;
  }

  /**
   * Creates a validator for content data that represents an external tileset.
   *
   * This validator will parse the JSON from the content data buffer, and
   * pass it to a default tileset validator.
   *
   * @returns The validator
   */
  private static createTilesetValidator(): Validator<ContentData> {
    const externalValidator = Validators.createDefaultTilesetValidator();
    const bufferValidator =
      Validators.parseFromBuffer<Tileset>(externalValidator);
    const contentDataValidator =
      ContentDataValidators.wrapBufferValidator(bufferValidator);
    return contentDataValidator;
  }

  /**
   * Creates a validator for content data that represents glTF JSON data.
   *
   * This validator will pass the buffer with the JSON data to the
   * standard glTF validator.
   *
   * @returns The validator
   */
  private static createGltfJsonValidator(): Validator<ContentData> {
    const bufferValidator = new GltfValidator();
    const contentDataValidator =
      ContentDataValidators.wrapBufferValidator(bufferValidator);
    return contentDataValidator;
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
    ContentDataValidators.registerDefaults();

    const contentDataTypeName =
      await ContentDataTypeRegistry.findContentDataType(contentData);
    if (!contentDataTypeName) {
      return undefined;
    }
    const dataValidator =
      ContentDataValidators.dataValidators[contentDataTypeName];
    return dataValidator;
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
          data,
          context
        );
        return result;
      },
    };
  }

  /**
   * Register a validator that should be used for the content
   * data buffer, when the content data has the type that is
   * indicated by the given name.
   *
   * @param contentDataTypeName - The content data type name
   * @param bufferValidator - The validator for the buffer data
   */
  private static registerForBuffer(
    contentDataTypeName: string,
    bufferValidator: Validator<Buffer>
  ) {
    ContentDataValidators.register(
      contentDataTypeName,
      ContentDataValidators.wrapBufferValidator(bufferValidator)
    );
  }

  /**
   * Registers a data validator that will be used when a
   * `ContentData` has the type that is indicated by the
   * given name.
   *
   * @param contentDataTypeName - The content data type name
   * @param dataValidator - The data validator
   */
  private static register(
    contentDataTypeName: string,
    dataValidator: Validator<ContentData>
  ) {
    ContentDataValidators.dataValidators[contentDataTypeName] = dataValidator;
  }
}
