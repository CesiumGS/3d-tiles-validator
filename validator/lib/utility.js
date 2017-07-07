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
    boxInsideBox : boxInsideBox
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

var scratchInnerHalfAxes = new Matrix3();
var scratchOuterHalfAxes = new Matrix3();
var transform = new Matrix4();
var scratchMatrixInner = new Matrix3();

// An array of 12 numbers that define an oriented bounding box.  
// The first three elements define the x, y, and z values for the center of the box.  
// The next three elements (with indices 3, 4, and 5) define the x axis direction and half-length.  
// The next three elements (indices 6, 7, and 8) define the y axis direction and half-length.  
// The last three elements (indices 9, 10, and 11) define the z axis direction and half-length.
function boxInsideBox(boxInner, boxOuter, transform) {
    var centerInner = Cartesian3.fromElements(boxInner[0], boxInner[1], boxInner[2], scratchInnnerCenter);
    var halfAxesInner = Matrix3.fromArray(boxInner, 3, scratchInnerHalfAxes);
    centerInner = Matrix4.multiplyByPoint(transform, center, center);
    var rotationScaleInner = Matrix4.getRotation(transform, scratchMatrixInner);
    halfAxesInner = Matrix3.multiply(rotationScaleInner, halfAxesInner, halfAxesInner);

    return (boxInner[0] >= boxOuter[0]) &&
        (boxInner[1] >= boxOuter[1]) &&
        (boxInner[2] <= boxOuter[2]) &&
        (boxInner[3] <= boxOuter[3]) &&
        (boxInner[4] >= boxOuter[4]) &&
        (boxInner[5] >= boxOuter[5]) &&
        (boxInner[6] <= boxOuter[6]) &&
        (boxInner[7] <= boxOuter[7]);
}
