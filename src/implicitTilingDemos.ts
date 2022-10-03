import path from "path";
import { defined } from "./base/defined";

import { readJsonUnchecked } from "./base/readJsonUnchecked";

import { ResourceResolvers } from "./io/ResourceResolvers";

import { Quadtrees } from "./implicitTiling/Quadtrees";
import { TemplateUris } from "./implicitTiling/TemplateUris";
import { QuadtreeCoordinates } from "./implicitTiling/QuadtreeCoordinates";
import { OctreeCoordinates } from "./implicitTiling/OctreeCoordinates";

import { TilesetTraverser } from "./traversal/TilesetTraverser";
import { SubtreeInfos } from "./implicitTiling/SubtreeInfos";

function testQuadtreeChildren() {
  const r = new QuadtreeCoordinates(0, 0, 0);
  console.log("Children of " + r + ":");
  for (const c of r.children()) {
    console.log("  " + c + " index " + c.toIndex() + " parent " + c.parent());
  }
}

function testQuadtreeDescendants() {
  const r = new QuadtreeCoordinates(0, 0, 0);
  const maxLevelInclusive = 3;
  console.log("Descendants of " + r + " up to " + maxLevelInclusive + ":");
  for (const c of r.descendants(maxLevelInclusive)) {
    console.log("  " + c + " index " + c.toIndex() + " parent " + c.parent());
  }
}

function testQuadtreeLevel() {
  const level = 3;
  const coords = Quadtrees.coordinatesForLevel(3);
  console.log("Coordinates in level " + level + ":");
  for (const c of coords) {
    console.log("  " + c);
  }
}

function testSubstituteQuadtree() {
  const uri = "test-{level}-{x}-{y}";
  const c = new QuadtreeCoordinates(3, 4, 5);
  const s = TemplateUris.substituteQuadtree(uri, c);
  console.log("uri        : " + uri);
  console.log("coordinates: " + c);
  console.log("result     : " + s);
}

function testSubstituteOctree() {
  const uri = "test-{level}-{x}-{y}-{z}";
  const c = new OctreeCoordinates(3, 4, 5, 6);
  const s = TemplateUris.substituteOctree(uri, c);
  console.log("uri        : " + uri);
  console.log("coordinates: " + c);
  console.log("result     : " + s);
}

async function testSubtreeInfo() {
  // Create a `SubtreeInfo` for a valid subtree, from
  // the spec data directory
  const subtreeFilePath = "specs/data/subtrees/validSubtree.json";
  const implcitTilingFilePath =
    "specs/data/subtrees/validSubtreeImplicitTiling.json.input";
  const implicitTiling = await readJsonUnchecked(implcitTilingFilePath);
  const subtree = await readJsonUnchecked(subtreeFilePath);
  const directory = path.dirname(subtreeFilePath);
  const resourceResolver =
    ResourceResolvers.createFileResourceResolver(directory);
  const subtreeInfo = await SubtreeInfos.create(
    subtree,
    undefined,
    implicitTiling,
    resourceResolver
  );
  if (!defined(subtreeInfo)) {
    console.log("Could not resolve subtree data");
    return;
  }

  console.log("Tile availability from indices:");
  const tileAvailabilityInfo = subtreeInfo!.getTileAvailabilityInfo()!;
  for (let i = 0; i < tileAvailabilityInfo.length; i++) {
    const available = tileAvailabilityInfo.isAvailable(i);
    console.log("  at index " + i + " available :" + available);
  }

  console.log("Tile availability from coordinates:");
  const r = new QuadtreeCoordinates(0, 0, 0);
  const maxLevelInclusive = implicitTiling.subtreeLevels - 1;
  for (const c of r.descendants(maxLevelInclusive)) {
    const index = c.toIndex();
    const available = tileAvailabilityInfo.isAvailable(index);
    console.log(
      "  " + c + " index " + c.toIndex() + " available: " + available
    );
  }
}

async function tilesetTraversalDemo(filePath: string) {
  const directory = path.dirname(filePath);
  const resourceResolver =
    ResourceResolvers.createFileResourceResolver(directory);
  const tileset = await readJsonUnchecked(filePath);
  // Note: External schemas are not considered here
  const schema = tileset.schema;
  const depthFirst = false;
  console.log("Traversing tileset");
  await TilesetTraverser.traverse(
    tileset,
    schema,
    resourceResolver,
    async (traversedTile) => {
      const contentUris = traversedTile.getContents().map((c) => c.uri);
      const geometricError = traversedTile.asTile().geometricError;
      console.log(
        `  Traversed tile: ${traversedTile}, ` +
          `path: ${traversedTile.path}, ` +
          `contents [${contentUris}], ` +
          `geometricError ${geometricError}`
      );
      return Promise.resolve(true);
    },
    depthFirst
  );
  console.log("Traversing tileset DONE");
}

async function runDemos() {
  testQuadtreeChildren();
  testQuadtreeDescendants();
  testQuadtreeLevel();
  testSubstituteQuadtree();
  testSubstituteOctree();
  await testSubtreeInfo();
  const tilesetFile = "specs/data/Samples/SparseImplicitQuadtree/tileset.json";
  //const tilesetFile = "C:/Develop/CesiumGS/3d-tiles-samples/1.1/SparseImplicitOctree/tileset.json";
  //const tilesetFile = "specs/data/tilesets/validTilesetWithTileMetadata.json";
  await tilesetTraversalDemo(tilesetFile);
}

runDemos();
