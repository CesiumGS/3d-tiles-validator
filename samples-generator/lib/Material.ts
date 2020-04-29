/**
 * A material that is applied to a mesh.
 *
 * @param {Object} [options] An object with the following properties:
 * @param {Array|String} [options.baseColor] The base color or base color texture path.
 *
 * @constructor
 */

export class Material {
    baseColor: number[];

    // TODO: Original code combined rgbas with jpg uris, should refactor
    //       this too.
    constructor(baseColor: number[] = [0.5, 0.5, 0.5, 1.0]) {
        this.baseColor = baseColor;
    }

    /**
     * Creates a Material from a glTF material. This utility is designed only for simple glTFs like those in the data folder.
     *
     * @param {Object} material The glTF material.
     * @returns {Material} The material.
     */

    static fromGltf(material: any): Material {
        return new Material(material.pbrMetallicRoughness.baseColorFactor);
    }
}

export class TexturedMaterial {
    // TODO: This MUST be named baseColor for now. Original version of this
    //       code didn't discriminate between RGBA / TexturePath coordinates
    //       createGltf.js will inspect the type of `baseColor` to determine
    //       what to do with this object. Needs to be refactored later.
    baseColor: string;

    constructor(baseColor: string) {
        this.baseColor = baseColor;
    }
}