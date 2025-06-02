import { Validators } from "../../src/validation/Validators";

describe("Tileset 3DTILES_content_gltf extension validation", function () {
  it("detects issues in contentGltfExtensionRequiredButNotUsed", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/contentGltfExtensionRequiredButNotUsed.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTENSION_REQUIRED_BUT_NOT_USED");
  });

  it("detects issues in contentGltfExtensionsRequiredDuplicateElement", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/contentGltfExtensionsRequiredDuplicateElement.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_NOT_UNIQUE");
  });

  it("detects issues in contentGltfExtensionsRequiredInvalidArrayLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/contentGltfExtensionsRequiredInvalidArrayLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in contentGltfExtensionsRequiredInvalidElementType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/contentGltfExtensionsRequiredInvalidElementType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in contentGltfExtensionsRequiredInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/contentGltfExtensionsRequiredInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in contentGltfExtensionsUsedDuplicateElement", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/contentGltfExtensionsUsedDuplicateElement.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_NOT_UNIQUE");
  });

  it("detects issues in contentGltfExtensionsUsedInvalidArrayLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/contentGltfExtensionsUsedInvalidArrayLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in contentGltfExtensionsUsedInvalidElementType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/contentGltfExtensionsUsedInvalidElementType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in contentGltfExtensionsUsedInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/contentGltfExtensionsUsedInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in tileset_1_0_withContentGltfRequiredButNotUsed", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/tileset_1_0_withContentGltfRequiredButNotUsed.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTENSION_REQUIRED_BUT_NOT_USED");
  });

  it("detects issues in tileset_1_0_withContentGltfUsedButNotFound", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/tileset_1_0_withContentGltfUsedButNotFound.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTENSION_USED_BUT_NOT_FOUND");
  });

  it("detects issues in tileset_1_0_withContentGltfUsedButNotRequired", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/tileset_1_0_withContentGltfUsedButNotRequired.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTENSION_REQUIRED_BUT_NOT_DECLARED");
  });

  it("detects issues in tileset_1_1_withContentGltfUsedButNotFound", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/tileset_1_1_withContentGltfUsedButNotFound.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTENSION_USED_BUT_NOT_FOUND");
  });

  it("detects no issues in validTileset_1_0_withGltf", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/validTileset_1_0_withGltf.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in validTileset_1_1_withContentGltfUsedAndFound", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/validTileset_1_1_withContentGltfUsedAndFound.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in validTileset_1_1_withGltf", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/contentGltf/validTileset_1_1_withGltf.json"
    );
    expect(result.length).toEqual(0);
  });
});
