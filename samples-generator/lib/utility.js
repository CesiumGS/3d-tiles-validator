'use strict';
var Cesium = require('cesium');

var Cartesian3 = Cesium.Cartesian3;
var HeadingPitchRoll = Cesium.HeadingPitchRoll;
var Transforms = Cesium.Transforms;

module.exports = {
    metersToLongitude : metersToLongitude,
    metersToLatitude : metersToLatitude,
    wgs84Transform : wgs84Transform,
    toCamelCase : toCamelCase,
    typeToNumberOfComponents : typeToNumberOfComponents
};

function metersToLongitude(meters, latitude) {
    return meters * 0.000000156785 / Math.cos(latitude);
}

function metersToLatitude(meters) {
    return meters * 0.000000157891;
}

function wgs84Transform(longitude, latitude, height) {
    return Transforms.headingPitchRollToFixedFrame(
        Cartesian3.fromRadians(longitude, latitude, height),
        new HeadingPitchRoll()
    );
}

function toCamelCase(s) {
    return s[0].toLowerCase() + s.slice(1);
}

function typeToNumberOfComponents(type) {
    switch (type) {
        case 'SCALAR':
            return 1;
        case 'VEC2':
            return 2;
        case 'VEC3':
            return 3;
        case 'VEC4':
            return 4;
        case 'MAT2':
            return 4;
        case 'MAT3':
            return 9;
        case 'MAT4':
            return 16;
    }
}

