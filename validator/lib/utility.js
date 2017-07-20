'use strict';
var Cesium = require('cesium');

var Cartesian3 = Cesium.Cartesian3;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;

module.exports = {
    typeToComponentsLength : typeToComponentsLength,
    componentTypeToByteLength : componentTypeToByteLength,
    isBufferValidUtf8 : isBufferValidUtf8,
    regionInsideRegion : regionInsideRegion,
    sphereInsideSphere : sphereInsideSphere,
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

var scratchInnnerCenter = new Cartesian3();
var scratchOuterCenter = new Cartesian3();

function sphereInsideSphere(sphereInner, sphereOuter) {
    var radiusInner= sphereInner[3];
    var radiusOuter = sphereOuter[3];
    var centerInner = Cartesian3.unpack(sphereInner, 0, scratchInnnerCenter);
    var centerOuter = Cartesian3.unpack(sphereOuter, 0, scratchOuterCenter);
    var distance = Cartesian3.distance(centerInner, centerOuter);
    return distance <= (radiusOuter - radiusInner);
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
