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

// An array of 12 numbers that define an oriented bounding box.  
// The first three elements define the x, y, and z values for the center of the box.  
// The next three elements (with indices 3, 4, and 5) define the x axis direction and half-length.  
// The next three elements (indices 6, 7, and 8) define the y axis direction and half-length.  
// The last three elements (indices 9, 10, and 11) define the z axis direction and half-length.
function boxInsideBox(boxInner, boxOuter) {
    var centerInner = Cartesian3.fromElements(boxInner[0], boxInner[1], boxInner[2]);
    var halfAxesInnerX = Cartesian3.fromElements(boxInner[3], boxInner[4], boxInner[5]);
    var halfAxesInnerY = Cartesian3.fromElements(boxInner[6], boxInner[7], boxInner[8]);
    var halfAxesInnerZ = Cartesian3.fromElements(boxInner[9], boxInner[10], boxInner[11]);

    var centerInnerPositive = new Cartesian3();
    Cartesian3.add(centerInner, halfAxesInnerX, centerInnerPositive);
    Cartesian3.add(centerInnerPositive, halfAxesInnerY, centerInnerPositive);
    Cartesian3.add(centerInnerPositive, halfAxesInnerZ, centerInnerPositive);

    var centerInnerNegative = new Cartesian3();
    Cartesian3.subtract(centerInner, halfAxesInnerX, centerInnerNegative);
    Cartesian3.subtract(centerInnerNegative, halfAxesInnerY, centerInnerNegative);
    Cartesian3.subtract(centerInnerNegative, halfAxesInnerZ, centerInnerNegative);

    var centerOuter = Cartesian3.fromElements(boxOuter[0], boxOuter[1], boxOuter[2]);
    var halfAxesOuterX = Cartesian3.fromElements(boxOuter[3], boxOuter[4], boxOuter[5]);
    var halfAxesOuterY = Cartesian3.fromElements(boxOuter[6], boxOuter[7], boxOuter[8]);
    var halfAxesOuterZ = Cartesian3.fromElements(boxOuter[9], boxOuter[10], boxOuter[11]);

    var centerOuterPositive = new Cartesian3();
    Cartesian3.add(centerOuter, halfAxesOuterX, centerOuterPositive);
    Cartesian3.add(centerOuterPositive, halfAxesOuterY, centerOuterPositive);
    Cartesian3.add(centerOuterPositive, halfAxesOuterZ, centerOuterPositive);

    var centerOuterNegative = new Cartesian3();
    Cartesian3.subtract(centerOuter, halfAxesOuterX, centerOuterNegative);
    Cartesian3.subtract(centerOuterNegative, halfAxesOuterY, centerOuterNegative);
    Cartesian3.subtract(centerOuterNegative, halfAxesOuterZ, centerOuterNegative);

    return (centerInnerPositive.x <= centerOuterPositive.x) &&
        (centerInnerPositive.y <= centerOuterPositive.y) &&
        (centerInnerPositive.z <= centerOuterPositive.z) &&
        (centerInnerNegative.x >= centerOuterNegative.x) &&
        (centerInnerNegative.y >= centerOuterNegative.y) &&
        (centerInnerNegative.z >= centerOuterNegative.z);
}
