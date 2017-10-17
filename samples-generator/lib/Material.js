'use strict';
var Cesium = require('cesium');

var defaultValue = Cesium.defaultValue;

module.exports = Material;

/**
 * A material that is applied to a mesh.
 *
 * @param {Object} [options] An object with the following properties:
 * @param {Array|String} [options.baseColor] The base color or base color texture path.
 *
 * @constructor
 */
function Material(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    this.baseColor = defaultValue(options.baseColor, [0.5, 0.5, 0.5, 1.0]);
}

/**
 * Creates a Material from a glTF material. This utility is designed only for simple glTFs like those in the data folder.
 *
 * @param {Object} material The glTF material.
 * @returns {Material} The material.
 */
Material.fromGltf = function(material) {
    return new Material({
        baseColor : material.pbrMetallicRoughness.baseColorFactor
    });
};
