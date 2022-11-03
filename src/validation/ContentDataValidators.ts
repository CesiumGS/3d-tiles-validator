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

/**
 * A class for managing `Validator` instances that are used for
 * validating the data that is pointed to by a `content.uri`.
 *
 * The only public methods (for now) are `registerDefaults`,
 * which registers all known content data validators, and
 * `findContentDataValidator`, which returns the validator
 * that should be used for a given `ContentData` object.
 *
 * @private
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

    ContentDataValidators.registerByExtension(
      ".3tz",
      new TilesetArchiveValidator()
    );

    ContentDataValidators.registerTileset();
    ContentDataValidators.registerGltf();
  }

  /**
   * Tries to find a data validator that can be used for validating
   * the given content data. If no matching validator can be found,
   * then `undefined` is returned.
   *
   * @param contentData The `ContentData`
   * @returns The validator, or `undefined`
   */
  static findContentDataValidator(
    contentData: ContentData
  ): Validator<Buffer> | undefined {
    for (const entry of ContentDataValidators.dataValidators) {
      if (entry.predicate(contentData)) {
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
   * @param magic The magic string
   * @param dataValidator The data validator
   */
  private static registerByMagic(
    magic: string,
    dataValidator: Validator<Buffer>
  ) {
    ContentDataValidators.registerByPredicate(
      (contentData: ContentData) => contentData.magic === magic,
      dataValidator
    );
  }

  /**
   * Register a validator that should be used when the content URI
   * has the given file extension
   *
   * The file extension should include the `"."` dot, and the
   * check for the file extension will be case INsensitive.
   *
   * @param extension The extension
   * @param dataValidator The data validator
   */
  private static registerByExtension(
    extension: string,
    dataValidator: Validator<Buffer>
  ) {
    ContentDataValidators.registerByPredicate(
      (contentData: ContentData) =>
        contentData.extension === extension.toLowerCase(),
      dataValidator
    );
  }

  /**
   * Register the data validator for (external) tileset files.
   *
   * The condition of whether this validator is used for
   * given content data is that it `isProbablyTileset`.
   */
  private static registerTileset() {
    const predicate = (contentData: ContentData) =>
      ContentDataValidators.isProbablyTileset(contentData);
    const externalValidator = Validators.createDefaultTilesetValidator();
    const dataValidator =
      Validators.parseFromBuffer<Tileset>(externalValidator);
    ContentDataValidators.registerByPredicate(predicate, dataValidator);
  }

  /**
   * Register the data validator for glTF files.
   *
   * This refers to JSON files (not GLB files), and checks
   * whether the object that is parsed from the JSON data
   * is probably a glTF asset, as of `isProbablyGltf`.
   */
  private static registerGltf() {
    const predicate = (contentData: ContentData) =>
      ContentDataValidators.isProbablyGltf(contentData);
    const dataValidator = new GltfValidator();
    ContentDataValidators.registerByPredicate(predicate, dataValidator);
  }

  /**
   * Returns whether the given content data is probably a tileset.
   *
   * The exact conditions for this method returning `true` are
   * intentionally not specified.
   *
   * @param contentData The content data
   * @returns Whether the content data is probably a tileset
   */
  private static isProbablyTileset(contentData: ContentData) {
    const parsedObject = contentData.parsedObject;
    if (!defined(parsedObject)) {
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
   * @param contentData The content data
   * @returns Whether the content data is probably glTF
   */
  static isProbablyGltf(contentData: ContentData) {
    if (ContentDataValidators.isProbablyTileset(contentData)) {
      return false;
    }
    const parsedObject = contentData.parsedObject;
    if (!defined(parsedObject)) {
      return false;
    }
    if (!defined(parsedObject.asset)) {
      return false;
    }
    return true;
  }

  /**
   * Registers a data validator that will be used when a
   * `ContentData` matches the given predicate.
   *
   * @param predicate The predicate
   * @param dataValidator The data validator
   */
  private static registerByPredicate(
    predicate: (contentData: ContentData) => boolean,
    dataValidator: Validator<Buffer>
  ) {
    const entry = {
      predicate: predicate,
      dataValidator: dataValidator,
    };
    ContentDataValidators.dataValidators.push(entry);
  }
}
