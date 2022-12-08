import { ResourceResolvers } from "../src/io/ResourceResolvers";
import { ContentData } from "../src/validation/ContentData";
import { ContentDataTypes } from "../src/validation/ContentDataTypes";

// Note: One coudld consider to simplify these tests to
// ContentDataTypes.nameFor(c) === expectedName,
// but they EXPLICITLY check whether the content
// type matches EXACTLY and ONLY the expected one

describe("ContentDataTypes", function () {
  it("detects GLB", async function () {
    const contentUri =
      "specs/data/tilesets/tiles/glTF/TriangleGlbWithErrors/TriangleGlbWithInvalidLength.glb";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeTrue();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeFalse();
  });

  it("detects B3DM", async function () {
    const contentUri = "specs/data/tilesets/tiles/b3dm/valid.b3dm";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeTrue();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeFalse();
  });

  it("detects I3DM", async function () {
    const contentUri = "specs/data/tilesets/tiles/i3dm/invalid.i3dm";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeTrue();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeFalse();
  });

  it("detects CMPT", async function () {
    const contentUri =
      "specs/data/tilesets/tiles/cmpt/validWithGlbWarning.cmpt";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeTrue();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeFalse();
  });

  it("detects PNTS", async function () {
    const contentUri = "specs/data/tilesets/tiles/pnts/invalid.pnts";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeTrue();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeFalse();
  });

  it("detects GEOM", async function () {
    const contentUri = "specs/data/tilesets/tiles/geom/content.geom";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeTrue();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeFalse();
  });

  it("detects VCTR", async function () {
    const contentUri = "specs/data/tilesets/tiles/vctr/parent.vctr";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeTrue();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeFalse();
  });

  it("detects GEOJSON", async function () {
    const contentUri = "specs/data/tilesets/tiles/geojson/lineString.geojson";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeTrue();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeFalse();
  });

  it("detects 3TZ", async function () {
    const contentUri = "specs/data/tilesets/tiles/3tz/simple.3tz";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeTrue();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeFalse();
  });

  it("detects glTF", async function () {
    const contentUri = "specs/data/tilesets/tiles/glTF/Triangle/Triangle.gltf";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeTrue();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeFalse();
  });

  it("detects tileset", async function () {
    const contentUri = "specs/data/tilesets/validTileset.json";
    const resourceResolver = ResourceResolvers.createFileResourceResolver("");
    const c = new ContentData(contentUri, resourceResolver);

    expect(await ContentDataTypes.CONTENT_TYPE_GLB(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_B3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_I3DM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_CMPT(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_PNTS(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOM(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_VCTR(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GEOJSON(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_3TZ(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_GLTF(c)).toBeFalse();
    expect(await ContentDataTypes.CONTENT_TYPE_TILESET(c)).toBeTrue();
  });
});
