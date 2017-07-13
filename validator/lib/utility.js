'use strict';
var Cesium = require('cesium');

var Cartesian3 = Cesium.Cartesian3;
var Plane = Cesium.Plane;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;

module.exports = {
    typeToComponentsLength : typeToComponentsLength,
    componentTypeToByteLength : componentTypeToByteLength,
    isBufferValidUtf8 : isBufferValidUtf8,
    regionInsideRegion : regionInsideRegion,
    sphereInsideSphere : sphereInsideSphere,
    sphereInsideBox : sphereInsideBox
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
// var scratchSphereCenter = new Cartesian3();
var scratchBoxHalfAxes = new Matrix3();

function sphereInsideBox(box, sphere) {
    var centerBox = Cartesian3.fromElements(box[0], box[1], box[2], scratchBoxCenter);
    var halfAxesBox = Matrix3.fromArray(box, 3, scratchBoxHalfAxes);
    var transformBox = Matrix4.fromRotationTranslation(halfAxesBox, centerBox);

    // var radiusSphere = sphere[3];
    // var centerSphere = Cartesian3.unpack(sphere, 0, scratchSphereCenter);

    var cube = new Array(8);
    cube[0] = new Cartesian3(0, 0, 0);
    cube[1] = new Cartesian3(0, 0, 1);
    cube[2] = new Cartesian3(1, 0, 1);
    cube[3] = new Cartesian3(1, 0, 0);
    cube[4] = new Cartesian3(0, 1, 0);
    cube[5] = new Cartesian3(0, 1, 1);
    cube[6] = new Cartesian3(1, 1, 1);
    cube[7] = new Cartesian3(1, 1, 0);

    var i;
    for (i = 0; i < 8; i++) {
        cube[i] = Matrix4.multiplyByPoint(transformBox, cube[i], cube[i]);
    }

    // Create 6 planes representing 6 faces
    //      - the normal should point toward the inside of the BB

    var cross = Cartesian3.cross;
    var subtract = Cartesian3.subtract;
    var face = new Array(6);
    var normal = new Cartesian3();

    normal = cross(subtract(cube[1], cube[2]), subtract(cube[0], cube[1]), normal);
    console.log('HI');
    face[0] = new Plane.fromPointNormal(cube[1], normal, face[0]);

    normal = cross(subtract(cube[6], cube[7]), subtract(cube[2], cube[6]), normal);
    face[1] = new Plane.fromPointNormal(cube[6], normal, face[1]);

    normal = cross(subtract(cube[5], cube[4]), subtract(cube[6], cube[5]), normal);
    face[2] = new Plane.fromPointNormal(cube[5], normal, face[2]);

    normal = cross(subtract(cube[1], cube[0]), subtract(cube[5], cube[1]), normal);
    face[3] = new Plane.fromPointNormal(cube[1], normal, face[3]);

    normal = cross(subtract(cube[2], cube[1]), subtract(cube[6], cube[2]), normal);
    face[4] = new Plane.fromPointNormal(cube[2], normal, face[4]);

    normal = cross(subtract(cube[3], cube[0]), subtract(cube[7], cube[3]), normal);
    face[5] = new Plane.fromPointNormal(cube[3], normal, face[5]);

    console.log(face);

    for (i = 0; i < 6; i++) {
        var intersection = sphere.intersectPlane(sphere, face[i]);
        if (intersection !== Cesium.Intersect.Inside) {
            return false;
        }
    }
    return true;
}
