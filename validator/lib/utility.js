'use strict';
var Cesium = require('cesium');

var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var Plane = Cesium.Plane;
var Sphere = Cesium.BoundingSphere;

module.exports = {
    typeToComponentsLength : typeToComponentsLength,
    componentTypeToByteLength : componentTypeToByteLength,
    isBufferValidUtf8 : isBufferValidUtf8,
    regionInsideRegion : regionInsideRegion,
    sphereInsideSphere : sphereInsideSphere,
    sphereInsideBox : sphereInsideBox,
    boxInsideBox : boxInsideBox,
    boxInsideSphere : boxInsideSphere
};

function typeToComponentsLength(type) {
    switch (type) {
        case 'SCALAR':
            return 1;
        case 'VEC2':
            return 2;
        case 'VEC3':
            return 3;
        case 'VEC4':
            return 4;
        default:
            return undefined;
    }
}

function componentTypeToByteLength(componentType) {
    switch (componentType) {
        case 'BYTE':
        case 'UNSIGNED_BYTE':
            return 1;
        case 'SHORT':
        case 'UNSIGNED_SHORT':
            return 2;
        case 'INT':
        case 'UNSIGNED_INT':
        case 'FLOAT':
            return 4;
        case 'DOUBLE':
            return 8;
        default:
            return undefined;
    }
}

function isBufferValidUtf8(buffer){
    return Buffer.compare(Buffer.from(buffer.toString()), buffer) === 0;
}

function regionInsideRegion(regionInner, regionOuter) {
    return (regionInner[0] >= regionOuter[0]) &&
        (regionInner[1] >= regionOuter[1]) &&
        (regionInner[2] <= regionOuter[2]) &&
        (regionInner[3] <= regionOuter[3]) &&
        (regionInner[4] >= regionOuter[4]) &&
        (regionInner[5] <= regionOuter[5]);
}

var scratchInnerCenter = new Cartesian3();
var scratchOuterCenter = new Cartesian3();

function sphereInsideSphere(sphereInner, sphereOuter) {
    var radiusInner= sphereInner[3];
    var radiusOuter = sphereOuter[3];
    var centerInner = Cartesian3.unpack(sphereInner, 0, scratchInnerCenter);
    var centerOuter = Cartesian3.unpack(sphereOuter, 0, scratchOuterCenter);
    var distance = Cartesian3.distance(centerInner, centerOuter);
    return distance <= (radiusOuter - radiusInner);
}

var scratchInnerHalfAxes = new Matrix3();
var scratchOuterHalfAxes = new Matrix3();

function boxInsideBox(boxInner, boxOuter) {
    var centerInner = Cartesian3.fromElements(boxInner[0], boxInner[1], boxInner[2], scratchInnerCenter);
    var halfAxesInner = Matrix3.fromArray(boxInner, 3, scratchInnerHalfAxes);
    var transformInner = Matrix4.fromRotationTranslation(halfAxesInner, centerInner);

    var centerOuter = Cartesian3.fromElements(boxOuter[0], boxOuter[1], boxOuter[2], scratchOuterCenter);
    var halfAxesOuter = Matrix3.fromArray(boxOuter, 3, scratchOuterHalfAxes);
    var transformOuter = Matrix4.fromRotationTranslation(halfAxesOuter, centerOuter);

    var cube = new Array(8);
    cube[0] = new Cartesian3(-1, -1, -1);
    cube[1] = new Cartesian3(-1, -1, 1);
    cube[2] = new Cartesian3(1, -1, 1);
    cube[3] = new Cartesian3(1, -1, -1);
    cube[4] = new Cartesian3(-1, 1, -1);
    cube[5] = new Cartesian3(-1, 1, 1);
    cube[6] = new Cartesian3(1, 1, 1);
    cube[7] = new Cartesian3(1, 1, -1);

    var transformInnerInverse = Matrix4.inverse(transformOuter, transformOuter);
    var EPSILON8 = CesiumMath.EPSILON8;
    for (var i = 0; i < 8; i++) {
        cube[i] = Matrix4.multiplyByPoint(transformInner, cube[i], cube[i]);
        cube[i] = Matrix4.multiplyByPoint(transformInnerInverse, cube[i], cube[i]);
        var min = Cartesian3.minimumComponent(cube[i]);
        var max = Cartesian3.maximumComponent(cube[i]);
        if (min < -1 - EPSILON8 || max > 1 + EPSILON8) {
            return false;
        }
    }
    return true;
}

var scratchBoxCenter = new Cartesian3();
var scratchSphereCenter = new Cartesian3();
var scratchBoxHalfAxes = new Matrix3();

function boxInsideSphere(box, sphere) {
    var centerBox = Cartesian3.fromElements(box[0], box[1], box[2], scratchBoxCenter);
    var halfAxesBox = Matrix3.fromArray(box, 3, scratchBoxHalfAxes);
    var transformBox = Matrix4.fromRotationTranslation(halfAxesBox, centerBox);

    var radiusSphere = sphere[3];
    var centerSphere = Cartesian3.unpack(sphere, 0, scratchSphereCenter);

    var cube = new Array(8);
    cube[0] = new Cartesian3(-1, -1, -1);
    cube[1] = new Cartesian3(-1, -1, 1);
    cube[2] = new Cartesian3(1, -1, 1);
    cube[3] = new Cartesian3(1, -1, -1);
    cube[4] = new Cartesian3(-1, 1, -1);
    cube[5] = new Cartesian3(-1, 1, 1);
    cube[6] = new Cartesian3(1, 1, 1);
    cube[7] = new Cartesian3(1, 1, -1);

    for (var i = 0; i < 8; i++) {
        cube[i] = Matrix4.multiplyByPoint(transformBox, cube[i], cube[i]);
        var distance = Cartesian3.distance(cube[i], centerSphere);
        if (distance > radiusSphere) {
            return false;
        }
    }
    return true;
}

function sphereInsideBox(sphere, box) {
    var centerBox = Cartesian3.fromElements(box[0], box[1], box[2], scratchBoxCenter);
    var halfAxesBox = Matrix3.fromArray(box, 3, scratchBoxHalfAxes);
    var transformBox = Matrix4.fromRotationTranslation(halfAxesBox, centerBox);

    var radiusSphere = sphere[3];
    var centerSphere = Cartesian3.unpack(sphere, 0, scratchSphereCenter);

    var cube = new Array(8);
    cube[0] = new Cartesian3(-1, -1, -1);
    cube[1] = new Cartesian3(-1, -1, 1);
    cube[2] = new Cartesian3(1, -1, 1);
    cube[3] = new Cartesian3(1, -1, -1);
    cube[4] = new Cartesian3(-1, 1, -1);
    cube[5] = new Cartesian3(-1, 1, 1);
    cube[6] = new Cartesian3(1, 1, 1);
    cube[7] = new Cartesian3(1, 1, -1);

    var i;
    for (i = 0; i < 8; i++) {
        cube[i] = Matrix4.multiplyByPoint(transformBox, cube[i], cube[i]);
    }

    var face = new Array(6);
    face[0] = planeFromPoints(cube[0], cube[1], cube[2]);
    face[1] = planeFromPoints(cube[2], cube[6], cube[7]);
    face[2] = planeFromPoints(cube[6], cube[5], cube[4]);
    face[3] = planeFromPoints(cube[5], cube[1], cube[0]);
    face[4] = planeFromPoints(cube[6], cube[2], cube[1]);
    face[5] = planeFromPoints(cube[0], cube[3], cube[7]);

    var boundingSphere = new Cesium.BoundingSphere(centerSphere, radiusSphere);
    for (i = 0; i < 6; i++) {
        var intersection = Sphere.intersectPlane(boundingSphere, face[i]);
        if (intersection !== Cesium.Intersect.INSIDE) {
            return false;
        }
    }
    return true;
}

function planeFromPoints(point1, point2, point3) {
    var a = new Cartesian3();
    var b = new Cartesian3();
    var c = new Cartesian3();
    var normal = new Cartesian3();

    Cartesian3.subtract(point2, point1, a);
    Cartesian3.subtract(point3, point2, b);
    Cartesian3.cross(a, b, c);
    Cartesian3.normalize(c, normal);

    var plane = new Plane.fromPointNormal(point1, normal);
    return plane;
}
