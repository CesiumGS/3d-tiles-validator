import { ValidationOptions } from "../src/validation/ValidationOptions";
import { Validators } from "../src/validation/Validators";

fdescribe("Bounding volume containment validation", function () {
  //==========================================================================
  // Valid basic:

  it("detects no issues in basic/validWithB3dm", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithB3dm.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithB3dmRtc", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithB3dmRtc.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithCmpt", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithCmpt.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithExternal", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithExternal.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithGlbBasic", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithGlbBasic.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithGlbContentBox", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithGlbContentBox.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithGlbNested", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithGlbNested.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithGlbRegion", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithGlbRegion.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithGlbRotation", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithGlbRotation.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithGlbScale", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithGlbScale.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithGlbSphereTRS", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithGlbSphereTRS.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithGlbTranslation", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithGlbTranslation.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithI3dm", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithI3dm.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithPnts", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithPnts.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in basic/validWithPntsRtc", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/validWithPntsRtc.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  //==========================================================================
  // Invalid basic:

  it("detects issues in basic/withExternalInvalidBox", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/withExternalInvalidBox.json",
      validationOptions
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTERNAL_TILESET_VALIDATION_ERROR");
  });

  it("detects issues in basic/withGlbInvalidContentBox", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/withGlbInvalidContentBox.json",
      validationOptions
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME"
    );
  });

  it("detects issues in basic/withGlbInvalidContentBox", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/withGlbInvalidContentBox.json",
      validationOptions
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME"
    );
  });

  it("detects issues in basic/withGlbInvalidRegion", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/withGlbInvalidRegion.json",
      validationOptions
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME"
    );
  });

  it("detects issues in basic/withGlbNestedInvalidBoxInner", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/withGlbNestedInvalidBoxInner.json",
      validationOptions
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME"
    );
  });

  it("detects issues in basic/withGlbNestedInvalidBoxRoot", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/withGlbNestedInvalidBoxRoot.json",
      validationOptions
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME"
    );
  });

  it("detects issues in basic/withGlbTRSInvalidSphere", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/basic/withGlbTRSInvalidSphere.json",
      validationOptions
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME"
    );
  });

  //==========================================================================
  // Valid ImplicitOctree:

  // Omitted - see https://github.com/CesiumGS/cesium/issues/13195#issuecomment-3915058716
  xit("detects no issues in ImplicitOctree/tilesetWithMetadataBoundingVolume", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/ImplicitOctree/tilesetWithMetadataBoundingVolume.json",
      validationOptions
    );
    expect(result.length).toEqual(0);
  });

  //==========================================================================
  // Invalid ImplicitOctree:

  it("detects issues in ImplicitOctree/tilesetWithInvalidBoundingVolume", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/ImplicitOctree/tilesetWithInvalidBoundingVolume.json",
      validationOptions
    );

    // There are 14 errors, because the whole hierarchy is invalid when
    // the root bounding volume is invalid:
    // '/root' for content 'content/content_0__0_0_0.glb'
    // '/root' for content 'content/content_1__0_0_1.glb'
    // '/root' for content 'content/content_2__0_3_3.glb'
    // '/root' for content 'content/content_3__7_7_7.glb'
    // '/root/at[0][0,0,0]' for content 'content/content_0__0_0_0.glb'
    // '/root/at[0][0,0,0]' for content 'content/content_3__7_7_7.glb'
    // '/root/at[0][0,0,0]' for content 'content/content_2__0_3_3.glb'
    // '/root/at[0][0,0,0]' for content 'content/content_1__0_0_1.glb'
    // '/root/at[1][0,0,1]' for content 'content/content_1__0_0_1.glb'
    // '/root/at[1][0,1,1]' for content 'content/content_2__0_3_3.glb'
    // '/root/at[1][1,1,1]' for content 'content/content_3__7_7_7.glb'
    // '/root/at[2][0,3,3]' for content 'content/content_2__0_3_3.glb'
    // '/root/at[2][3,3,3]' for content 'content/content_3__7_7_7.glb'
    // '/root/at[3][7,7,7]' for content 'content/content_3__7_7_7.glb'
    expect(result.length).toEqual(14);
    for (let i = 0; i < 14; i++) {
      expect(result.get(i).type).toEqual(
        "CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME"
      );
    }
  });

  // Omitted - see https://github.com/CesiumGS/cesium/issues/13195#issuecomment-3915058716
  xit("detects issues in ImplicitOctree/tilesetWithInvalidMetadataBoundingVolume", async function () {
    const validationOptions = new ValidationOptions();
    validationOptions.validateBoundingVolumeContainment = true;
    const result = await Validators.validateTilesetFile(
      "specs/data/boundingVolumes/ImplicitOctree/tilesetWithInvalidMetadataBoundingVolume.json",
      validationOptions
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME"
    );
  });
});
