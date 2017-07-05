'use strict';
var Cesium = require('cesium');

var defaultValue = Cesium.defaultValue;

module.exports = Material;

/**
 * A material that is applied to a mesh.
 *
 * @param {Object} [options] An object with the following properties:
 * @param {Array|String} [options.ambient] The ambient color or ambient texture path.
 * @param {Array|String} [options.diffuse] The diffuse color or diffuse texture path.
 * @param {Array|String} [options.emission] The emission color or emission texture path.
 * @param {Array|String} [options.specular] The specular color or specular texture path.
 * @param {Number} [options.shininess=0.0] The specular shininess.
 *
 * @constructor
 */
function Material(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    this.ambient = defaultValue(options.ambient, [0.0, 0.0, 0.0, 1.0]);
    this.diffuse = defaultValue(options.diffuse, [0.5, 0.5, 0.5, 1.0]);
    this.emission = defaultValue(options.emission, [0.0, 0.0, 0.0, 1.0]);
    this.specular = defaultValue(options.specular, [0.0, 0.0, 0.0, 1.0]);
    this.shininess = defaultValue(options.shininess, 0.0);
}

/**
 * Creates a Material from a glTF material. This utility is designed only for simple glTFs like those in the data folder.
 *
 * @param {Object} material The glTF material.
 * @returns {Material} The material.
 */
Material.fromGltf = function(material) {
    var values = material.values;
    return new Material({
        ambient : values.ambient,
        diffuse : values.diffuse,
        emission : values.emission,
        specular : values.specular,
        shininess : values.shininess
    });
};
