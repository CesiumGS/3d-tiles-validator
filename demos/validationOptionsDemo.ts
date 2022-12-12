import {
  Validators,
  ValidationOptions,
} from "../src";


async function runWithIncluded() {    

  // Options that list the included types, including B3DM:
  const options = ValidationOptions.fromJson({
    validateContentData: true, // The default
    includeContentTypes: [
      "CONTENT_TYPE_B3DM", // Explicitly included here
    ],
    excludeContentTypes: undefined, // The default
  });
  const tilesetFile = "specs/data/tilesets/validTilesetWithInvalidB3dm.json";
  const result = await Validators.validateTilesetFile(tilesetFile, options);

  console.log("Result of validating a tileset with an invalid B3DM, ")
  console.log("with the B3MD content type being INcluded:")
  console.log(result.serialize());
  console.log("-".repeat(80));
}


async function runWithoutIncluded() {    

  // Options that list the included types, NOT including B3DM:
  const options = ValidationOptions.fromJson({
    validateContentData: true, // The default
    includeContentTypes: [
      //"CONTENT_TYPE_B3DM", // Not included here!
    ],
    excludeContentTypes: undefined, // The default
  });
  const tilesetFile = "specs/data/tilesets/validTilesetWithInvalidB3dm.json";
  const result = await Validators.validateTilesetFile(tilesetFile, options);

  console.log("Result of validating a tileset with an invalid B3DM, ")
  console.log("with the B3MD content type NOT being INcluded:")
  console.log(result.serialize());
  console.log("-".repeat(80));
}


async function runWithExcluded() {    

  // Options that list the included types, EXcluding B3DM:
  const options = ValidationOptions.fromJson({
    validateContentData: true, // The default
    includeContentTypes: undefined, // The default
    excludeContentTypes: [
      "CONTENT_TYPE_B3DM" // Explicitly excluded here
    ]
  });
  const tilesetFile = "specs/data/tilesets/validTilesetWithInvalidB3dm.json";
  const result = await Validators.validateTilesetFile(tilesetFile, options);

  console.log("Result of validating a tileset with an invalid B3DM, ")
  console.log("with the B3MD content type being EXcluded:")
  console.log(result.serialize());
  console.log("-".repeat(80));
}


async function runWithoutExcluded() {    

  // Options that list the included types, NOT excluding B3DM:
  const options = ValidationOptions.fromJson({
    validateContentData: true, // The default
    includeContentTypes: undefined, // The default
    excludeContentTypes: [
      // "CONTENT_TYPE_B3DM" // NOT Excluded here
    ]
  });
  const tilesetFile = "specs/data/tilesets/validTilesetWithInvalidB3dm.json";
  const result = await Validators.validateTilesetFile(tilesetFile, options);

  console.log("Result of validating a tileset with an invalid B3DM, ")
  console.log("the B3MD content type NOT being EXcluded:")
  console.log(result.serialize());
  console.log("-".repeat(80));
}




async function runDemo() {    
  await runWithIncluded();
  await runWithoutIncluded();
  await runWithExcluded();
  await runWithoutExcluded();
}

runDemo();