// Mostly taken from https://github.com/CesiumGS/3d-tiles-validator/tree/e84202480eb6572383008076150c8e52c99af3c3
import {
  BoundingSphere,
  Cartesian3,
  Intersect,
  Math,
  Matrix3,
  Matrix4,
  Plane,
} from "cesium";
import { defined } from "3d-tiles-tools";
import { BoundingVolume } from "3d-tiles-tools";

/**
 * The checks for bounding volumes from the the original 3d-tiles-validator.
 */
export class BoundingVolumeChecks {
  /**
   * The only public method:
   *
   * Checks if the given inner bounding volume is contained in
   * the given outer bounding volume, taking the given transforms
   * into account.
   *
   * If the inner bounding volume is contained in the outer one,
   * then `undefined` is returned.
   * Otherwise, an error message is returned.
   *
   * @param innerBoundingVolume - The inner `BoundingVolume`
   * @param outerBoundingVolume - The outer `BoundingVolume`
   * @param innerTransformArray - The inner transform as an array of 16 elements
   * @param outerTransformArray - The outer transform as an array of 16 elements
   * @returns An error message, or `undefined`
   */
  static checkBoundingVolume(
    innerBoundingVolume: BoundingVolume,
    outerBoundingVolume: BoundingVolume,
    innerTransformArray: number[] | undefined,
    outerTransformArray: number[] | undefined
  ): string | undefined {
    let innerTransform = Matrix4.IDENTITY;
    if (defined(innerTransformArray)) {
      innerTransform = Matrix4.fromArray(innerTransformArray);
    }
    let outerTransform = Matrix4.IDENTITY;
    if (defined(outerTransformArray)) {
      outerTransform = Matrix4.fromArray(outerTransformArray);
    }

    if (defined(innerBoundingVolume.box) && defined(outerBoundingVolume.box)) {
      // Box in Box check
      const transformedInnerTile = BoundingVolumeChecks.getTransformedBox(
        innerBoundingVolume.box,
        innerTransform
      );
      const transformedOuterTile = BoundingVolumeChecks.getTransformedBox(
        outerBoundingVolume.box,
        outerTransform
      );
      if (
        !BoundingVolumeChecks.boxInsideBox(
          transformedInnerTile,
          transformedOuterTile
        )
      ) {
        return `box [${innerBoundingVolume.box}] is not within box [${outerBoundingVolume.box}]`;
      }
    } else if (
      defined(innerBoundingVolume.sphere) &&
      defined(outerBoundingVolume.sphere)
    ) {
      // Sphere in Sphere
      const transformedInnerTile = BoundingVolumeChecks.getTransformedSphere(
        innerBoundingVolume.sphere,
        innerTransform
      );
      const transformedOuterTile = BoundingVolumeChecks.getTransformedSphere(
        outerBoundingVolume.sphere,
        outerTransform
      );
      if (
        !BoundingVolumeChecks.sphereInsideSphere(
          transformedInnerTile,
          transformedOuterTile
        )
      ) {
        return `sphere [${innerBoundingVolume.sphere}] is not within sphere [${outerBoundingVolume.sphere}]`;
      }
    } else if (
      defined(innerBoundingVolume.region) &&
      defined(outerBoundingVolume.region)
    ) {
      // Region in Region
      // Region does not update with transform
      const transformedInnerTile = innerBoundingVolume.region;
      const transformedOuterTile = outerBoundingVolume.region;
      if (
        !BoundingVolumeChecks.regionInsideRegion(
          transformedInnerTile,
          transformedOuterTile
        )
      ) {
        return `region [${innerBoundingVolume.region}] is not within region [${outerBoundingVolume.region}]`;
      }
    } else if (
      defined(innerBoundingVolume.box) &&
      defined(outerBoundingVolume.sphere)
    ) {
      // Box in Sphere
      const transformedInnerTile = BoundingVolumeChecks.getTransformedBox(
        innerBoundingVolume.box,
        innerTransform
      );
      const transformedOuterTile = BoundingVolumeChecks.getTransformedSphere(
        outerBoundingVolume.sphere,
        outerTransform
      );
      if (
        !BoundingVolumeChecks.boxInsideSphere(
          transformedInnerTile,
          transformedOuterTile
        )
      ) {
        return `box [${innerBoundingVolume.box}] is not within sphere [${outerBoundingVolume.sphere}]`;
      }
    } else if (
      defined(innerBoundingVolume.sphere) &&
      defined(outerBoundingVolume.box)
    ) {
      // Sphere in Box
      const transformedInnerTile = BoundingVolumeChecks.getTransformedSphere(
        innerBoundingVolume.sphere,
        innerTransform
      );
      const transformedOuterTile = BoundingVolumeChecks.getTransformedBox(
        outerBoundingVolume.box,
        outerTransform
      );
      if (
        !BoundingVolumeChecks.sphereInsideBox(
          transformedInnerTile,
          transformedOuterTile
        )
      ) {
        return `sphere [${innerBoundingVolume.sphere}] is not within box [${outerBoundingVolume.box}]`;
      }
    }
  }

  private static readonly scratchMatrix = new Matrix3();
  private static readonly scratchHalfAxes = new Matrix3();
  private static readonly scratchCenter = new Cartesian3();
  private static readonly scratchScale = new Cartesian3();

  private static getTransformedBox(box: number[], transform: Matrix4) {
    let center = Cartesian3.fromElements(
      box[0],
      box[1],
      box[2],
      BoundingVolumeChecks.scratchCenter
    );
    let halfAxes = Matrix3.fromArray(
      box,
      3,
      BoundingVolumeChecks.scratchHalfAxes
    );

    // Find the transformed center and halfAxes
    center = Matrix4.multiplyByPoint(transform, center, center);
    const rotationScale = Matrix4.getMatrix3(
      transform,
      BoundingVolumeChecks.scratchMatrix
    );
    halfAxes = Matrix3.multiply(rotationScale, halfAxes, halfAxes);

    // Return a Box array
    const returnBox = [
      center.x,
      center.y,
      center.z,
      halfAxes[0],
      halfAxes[3],
      halfAxes[6],
      halfAxes[1],
      halfAxes[4],
      halfAxes[7],
      halfAxes[2],
      halfAxes[5],
      halfAxes[8],
    ];
    return returnBox;
  }

  private static getTransformedSphere(sphere: number[], transform: Matrix4) {
    let center = Cartesian3.fromElements(
      sphere[0],
      sphere[1],
      sphere[2],
      BoundingVolumeChecks.scratchCenter
    );
    let radius = sphere[3];

    // Find the transformed center and radius
    center = Matrix4.multiplyByPoint(transform, center, center);
    const scale = Matrix4.getScale(
      transform,
      BoundingVolumeChecks.scratchScale
    );
    const uniformScale = Cartesian3.maximumComponent(scale);
    radius *= uniformScale;

    // Return a Sphere array
    const returnSphere = [center.x, center.y, center.z, radius];
    return returnSphere;
  }

  private static regionInsideRegion(
    regionInner: number[],
    regionOuter: number[]
  ) {
    return (
      regionInner[0] >= regionOuter[0] &&
      regionInner[1] >= regionOuter[1] &&
      regionInner[2] <= regionOuter[2] &&
      regionInner[3] <= regionOuter[3] &&
      regionInner[4] >= regionOuter[4] &&
      regionInner[5] <= regionOuter[5]
    );
  }

  private static readonly scratchInnerCenter = new Cartesian3();
  private static readonly scratchOuterCenter = new Cartesian3();

  private static sphereInsideSphere(
    sphereInner: number[],
    sphereOuter: number[]
  ) {
    const radiusInner = sphereInner[3];
    const radiusOuter = sphereOuter[3];
    const centerInner = Cartesian3.unpack(
      sphereInner,
      0,
      BoundingVolumeChecks.scratchInnerCenter
    );
    const centerOuter = Cartesian3.unpack(
      sphereOuter,
      0,
      BoundingVolumeChecks.scratchOuterCenter
    );
    const distance = Cartesian3.distance(centerInner, centerOuter);
    return distance <= radiusOuter - radiusInner;
  }

  private static readonly scratchInnerHalfAxes = new Matrix3();
  private static readonly scratchOuterHalfAxes = new Matrix3();

  private static boxInsideBox(boxInner: number[], boxOuter: number[]) {
    const centerInner = Cartesian3.fromElements(
      boxInner[0],
      boxInner[1],
      boxInner[2],
      BoundingVolumeChecks.scratchInnerCenter
    );
    const halfAxesInner = Matrix3.fromArray(
      boxInner,
      3,
      BoundingVolumeChecks.scratchInnerHalfAxes
    );
    const transformInner = Matrix4.fromRotationTranslation(
      halfAxesInner,
      centerInner
    );

    const centerOuter = Cartesian3.fromElements(
      boxOuter[0],
      boxOuter[1],
      boxOuter[2],
      BoundingVolumeChecks.scratchOuterCenter
    );
    const halfAxesOuter = Matrix3.fromArray(
      boxOuter,
      3,
      BoundingVolumeChecks.scratchOuterHalfAxes
    );
    const transformOuter = Matrix4.fromRotationTranslation(
      halfAxesOuter,
      centerOuter
    );

    const cube = BoundingVolumeChecks.createUnitCube();

    const transformInnerInverse = Matrix4.inverse(
      transformOuter,
      transformOuter
    );
    for (let i = 0; i < 8; i++) {
      cube[i] = Matrix4.multiplyByPoint(transformInner, cube[i], cube[i]);
      cube[i] = Matrix4.multiplyByPoint(
        transformInnerInverse,
        cube[i],
        cube[i]
      );
      const min = Cartesian3.minimumComponent(cube[i]);
      const max = Cartesian3.maximumComponent(cube[i]);
      if (min < -1.0 - Math.EPSILON8 || max > 1.0 + Math.EPSILON8) {
        return false;
      }
    }
    return true;
  }

  private static readonly scratchBoxCenter = new Cartesian3();
  private static readonly scratchSphereCenter = new Cartesian3();
  private static readonly scratchBoxHalfAxes = new Matrix3();

  private static boxInsideSphere(box: number[], sphere: number[]) {
    const centerBox = Cartesian3.fromElements(
      box[0],
      box[1],
      box[2],
      BoundingVolumeChecks.scratchBoxCenter
    );
    const halfAxesBox = Matrix3.fromArray(
      box,
      3,
      BoundingVolumeChecks.scratchBoxHalfAxes
    );
    const transformBox = Matrix4.fromRotationTranslation(
      halfAxesBox,
      centerBox
    );

    const radiusSphere = sphere[3];
    const centerSphere = Cartesian3.unpack(
      sphere,
      0,
      BoundingVolumeChecks.scratchSphereCenter
    );

    const cube = BoundingVolumeChecks.createUnitCube();

    for (let i = 0; i < 8; i++) {
      cube[i] = Matrix4.multiplyByPoint(transformBox, cube[i], cube[i]);
      const distance = Cartesian3.distance(cube[i], centerSphere);
      if (distance > radiusSphere) {
        return false;
      }
    }
    return true;
  }

  private static sphereInsideBox(sphere: number[], box: number[]) {
    const centerBox = Cartesian3.fromElements(
      box[0],
      box[1],
      box[2],
      BoundingVolumeChecks.scratchBoxCenter
    );
    const halfAxesBox = Matrix3.fromArray(
      box,
      3,
      BoundingVolumeChecks.scratchBoxHalfAxes
    );
    const transformBox = Matrix4.fromRotationTranslation(
      halfAxesBox,
      centerBox
    );

    const radiusSphere = sphere[3];
    const centerSphere = Cartesian3.unpack(
      sphere,
      0,
      BoundingVolumeChecks.scratchSphereCenter
    );

    const cube = BoundingVolumeChecks.createUnitCube();

    for (let i = 0; i < 8; i++) {
      cube[i] = Matrix4.multiplyByPoint(transformBox, cube[i], cube[i]);
    }

    const face = new Array(6);
    face[0] = BoundingVolumeChecks.planeFromPoints(cube[0], cube[1], cube[2]);
    face[1] = BoundingVolumeChecks.planeFromPoints(cube[2], cube[6], cube[7]);
    face[2] = BoundingVolumeChecks.planeFromPoints(cube[6], cube[5], cube[4]);
    face[3] = BoundingVolumeChecks.planeFromPoints(cube[5], cube[1], cube[0]);
    face[4] = BoundingVolumeChecks.planeFromPoints(cube[6], cube[2], cube[1]);
    face[5] = BoundingVolumeChecks.planeFromPoints(cube[0], cube[3], cube[7]);

    const boundingSphere = new BoundingSphere(centerSphere, radiusSphere);
    for (let i = 0; i < 6; i++) {
      const intersection = BoundingSphere.intersectPlane(
        boundingSphere,
        face[i]
      );
      if (intersection !== Intersect.INSIDE) {
        return false;
      }
    }
    return true;
  }

  private static planeFromPoints(
    point1: Cartesian3,
    point2: Cartesian3,
    point3: Cartesian3
  ): Plane {
    const a = new Cartesian3();
    const b = new Cartesian3();
    const c = new Cartesian3();
    const normal = new Cartesian3();

    Cartesian3.subtract(point2, point1, a);
    Cartesian3.subtract(point3, point2, b);
    Cartesian3.cross(a, b, c);
    Cartesian3.normalize(c, normal);

    return Plane.fromPointNormal(point1, normal);
  }

  private static createUnitCube(): Array<Cartesian3> {
    const cube = new Array(8);
    cube[0] = new Cartesian3(-1, -1, -1);
    cube[1] = new Cartesian3(-1, -1, 1);
    cube[2] = new Cartesian3(1, -1, 1);
    cube[3] = new Cartesian3(1, -1, -1);
    cube[4] = new Cartesian3(-1, 1, -1);
    cube[5] = new Cartesian3(-1, 1, 1);
    cube[6] = new Cartesian3(1, 1, 1);
    cube[7] = new Cartesian3(1, 1, -1);
    return cube;
  }
}
