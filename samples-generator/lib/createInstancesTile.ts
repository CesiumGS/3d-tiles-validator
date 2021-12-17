import fsExtra = require('fs-extra');
import path = require('path');
import { Gltf } from './gltfType';
import {
    FLOAT32_SIZE_BYTES,
    UINT16_SIZE_BYTES,
    UINT8_SIZE_BYTES,
    UINT32_SIZE_BYTES
} from './typeSize';
import {
    Matrix4,
    Cartesian2,
    Cartesian3,
    Math as CesiumMath,
    defaultValue
} from 'cesium';

const createI3dm = require('./createI3dm');
const AttributeCompression = require('cesium').AttributeCompression;

export interface InstanceTileOptions {
    uri: string;
    tileWidth?: number;
    transform?: Matrix4;
    instancesLength?: number;
    embed?: boolean;
    modelSize?: number;
    createBatchTable?: boolean;
    createBatchTableBinary?: boolean;
    relativeToCenter?: boolean;
    quantizePositions?: boolean;
    eastNorthUp?: boolean;
    orientations?: boolean;
    octEncodeOrientations?: boolean;
    uniformScales?: boolean;
    nonUniformScales?: boolean;
    batchIds?: boolean;
    use3dTilesNext?: boolean;
    useGlb?: boolean;
}

export interface InstancesTileResult {
    glb?: Buffer,
    gltf?: Gltf,
    i3dm?: any,
    batchTableJson?: any
}

/**
 * Creates a i3dm tile that represents a set of instances.
 *
 * @param {Object} options Object with the following properties:
 * @param {Object} options.uri Uri to the instanced binary glTF model.
 * @param {Number} [options.tileWidth=200.0] The width of the tile in meters.
 * @param {Matrix4} [options.transform=Matrix4.IDENTITY] A transform to bake into the tile, for example a transform into WGS84.
 * @param {Number} [options.instancesLength=25] The number of instances.
 * @param {Boolean} [options.embed=true] Whether to embed the glTF in the tile or not.
 * @param {Number} [options.modelSize=20.0] The height of the instanced model. Used to generate metadata for the batch table.
 * @param {Boolean} [options.createBatchTable=true] Create a batch table for the i3dm tile.
 * @param {Boolean} [options.createBatchTableBinary=false] Create a batch table binary for the i3dm tile.
 * @param {Boolean} [options.relativeToCenter=false] Instance positions defined relative to center.
 * @param {Boolean} [options.quantizePositions=false] Quantize instanced positions.
 * @param {Boolean} [options.eastNorthUp=true] Instance orientations default to the east/north/up reference frame's orientation on the WGS84 ellipsoid.
 * @param {Boolean} [options.orientations=false] Generate orientations for the instances.
 * @param {Boolean} [options.octEncodeOrientations=false] Apply oct32p encoding on the instance orientations.
 * @param {Boolean} [options.uniformScales=false] Generate uniform scales for the instances.
 * @param {Boolean} [options.nonUniformScales=false] Generate non-uniform scales for the instances.
 * @param {Boolean} [options.batchIds=false] Generate batch ids for the instances. Not required even if createBatchTable is true.
 *
 * @returns {Promise} A promise that resolves with the i3dm buffer and batch table JSON.
 */
export async function createInstancesTile(
    options: InstanceTileOptions
): Promise<InstancesTileResult> {
    // Set the random number seed before creating the instances so that the generated instances are the same between runs
    CesiumMath.setRandomNumberSeed(0);

    options = defaultValue(options, {});
    const tileWidth = defaultValue(options.tileWidth, 200.0);
    const transform = defaultValue(options.transform, Matrix4.IDENTITY);
    const instancesLength = defaultValue(options.instancesLength, 25);
    let uri = options.uri;
    const embed = defaultValue(options.embed, true) as boolean;
    const modelSize = defaultValue(options.modelSize, 20.0) as number;
    const createBatchTable = defaultValue(options.createBatchTable, true);
    const createBatchTableBinary = defaultValue(
        options.createBatchTableBinary,
        false
    );
    const relativeToCenter = defaultValue(options.relativeToCenter, false);
    const quantizePositions = defaultValue(options.quantizePositions, false);
    const eastNorthUp = defaultValue(options.eastNorthUp, false);
    const orientations = defaultValue(options.orientations, false);
    const octEncodeOrientations = defaultValue(
        options.octEncodeOrientations,
        false
    );
    const uniformScales = defaultValue(options.uniformScales, false);
    const nonUniformScales = defaultValue(options.nonUniformScales, false);
    const batchIds = defaultValue(options.batchIds, false);

    const featureTableJson: any = {};
    featureTableJson.INSTANCES_LENGTH = instancesLength;

    let attributes = [];

    const center = Matrix4.multiplyByPoint(
        transform,
        new Cartesian3(),
        new Cartesian3()
    );
    if (relativeToCenter) {
        attributes.push(
            getPositionsRTC(
                instancesLength,
                tileWidth,
                modelSize,
                transform,
                center
            )
        );
        featureTableJson.RTC_CENTER = [center.x, center.y, center.z];
    } else if (quantizePositions) {
        const halfWidth = tileWidth / 2.0;
        attributes.push(
            getPositionsQuantized(
                instancesLength,
                tileWidth,
                modelSize,
                transform,
                center
            )
        );
        featureTableJson.QUANTIZED_VOLUME_SCALE = [
            tileWidth,
            tileWidth,
            tileWidth
        ];
        featureTableJson.QUANTIZED_VOLUME_OFFSET = [
            center.x - halfWidth,
            center.y - halfWidth,
            center.z - halfWidth
        ];
    } else {
        attributes.push(
            getPositions(instancesLength, tileWidth, modelSize, transform)
        );
    }

    if (orientations) {
        if (octEncodeOrientations) {
            attributes = attributes.concat(
                getOrientationsOctEncoded(instancesLength)
            );
        } else {
            attributes = attributes.concat(getOrientations(instancesLength));
        }
    } else if (eastNorthUp) {
        featureTableJson.EAST_NORTH_UP = true;
    }

    if (uniformScales) {
        attributes.push(getUniformScales(instancesLength));
    } else if (nonUniformScales) {
        attributes.push(getNonUniformScales(instancesLength));
    }

    if (batchIds) {
        attributes.push(getBatchIds(instancesLength));
    }

    let i;
    let attribute;
    let byteOffset = 0;
    let attributesLength = attributes.length;
    for (i = 0; i < attributesLength; ++i) {
        attribute = attributes[i];
        const byteAlignment = attribute.byteAlignment;
        byteOffset = Math.ceil(byteOffset / byteAlignment) * byteAlignment; // Round up to the required alignment
        attribute.byteOffset = byteOffset;
        byteOffset += attribute.buffer.length;
    }

    const featureTableBinary = Buffer.alloc(byteOffset);

    for (i = 0; i < attributesLength; ++i) {
        attribute = attributes[i];
        featureTableJson[attribute.propertyName] = {
            byteOffset: attribute.byteOffset,
            componentType: attribute.componentType // Only defined for batchIds
        };
        attribute.buffer.copy(featureTableBinary, attribute.byteOffset);
    }

    let batchTableJson;
    let batchTableBinary;
    if (createBatchTable) {
        if (createBatchTableBinary) {
            const batchTable = generateBatchTableBinary(instancesLength);
            batchTableJson = batchTable.json;
            batchTableBinary = batchTable.binary;
        } else {
            batchTableJson = generateInstancesBatchTable(
                instancesLength,
                modelSize
            );
        }
    }

    let glb = await fsExtra.readFile(uri);
    glb = embed ? glb : undefined;
    uri = path.basename(uri);
    const i3dm = createI3dm({
        featureTableJson: featureTableJson,
        featureTableBinary: featureTableBinary,
        batchTableJson: batchTableJson,
        batchTableBinary: batchTableBinary,
        glb: glb,
        uri: uri
    });
    return {
        i3dm: i3dm,
        batchTableJson: batchTableJson
    };
}

function getPosition(i, instancesLength, tileWidth, modelSize, transform) {
    const width = Math.round(Math.sqrt(instancesLength));
    let x = i % width;
    let y = Math.floor(i / width);
    let z = 0.0;

    x = x / (width - 1) - 0.5;
    y = y / (width - 1) - 0.5;

    x *= tileWidth - modelSize * 2.0;
    y *= tileWidth - modelSize * 2.0;

    let position = new Cartesian3(x, y, z);
    Matrix4.multiplyByPoint(transform, position, position);

    return position;
}

function getPositions(instancesLength, tileWidth, modelSize, transform) {
    const buffer = Buffer.alloc(instancesLength * 3 * FLOAT32_SIZE_BYTES);
    for (let i = 0; i < instancesLength; ++i) {
        const position = getPosition(
            i,
            instancesLength,
            tileWidth,
            modelSize,
            transform
        );
        buffer.writeFloatLE(position.x, i * 3 * FLOAT32_SIZE_BYTES);
        buffer.writeFloatLE(position.y, (i * 3 + 1) * FLOAT32_SIZE_BYTES);
        buffer.writeFloatLE(position.z, (i * 3 + 2) * FLOAT32_SIZE_BYTES);
    }
    return {
        buffer: buffer,
        propertyName: 'POSITION',
        byteAlignment: FLOAT32_SIZE_BYTES
    };
}

function getPositionsRTC(
    instancesLength,
    tileWidth,
    modelSize,
    transform,
    center
) {
    const buffer = Buffer.alloc(instancesLength * 3 * FLOAT32_SIZE_BYTES);
    for (let i = 0; i < instancesLength; ++i) {
        let position = getPosition(
            i,
            instancesLength,
            tileWidth,
            modelSize,
            transform
        );
        position = Cartesian3.subtract(position, center, position);
        buffer.writeFloatLE(position.x, i * 3 * FLOAT32_SIZE_BYTES);
        buffer.writeFloatLE(position.y, (i * 3 + 1) * FLOAT32_SIZE_BYTES);
        buffer.writeFloatLE(position.z, (i * 3 + 2) * FLOAT32_SIZE_BYTES);
    }
    return {
        buffer: buffer,
        propertyName: 'POSITION',
        byteAlignment: FLOAT32_SIZE_BYTES
    };
}

function getPositionsQuantized(
    instancesLength,
    tileWidth,
    modelSize,
    transform,
    center
) {
    const min = -tileWidth / 2.0;
    const max = tileWidth / 2.0;
    const range = Math.pow(2, 16) - 1;
    const scale = max - min;
    const buffer = Buffer.alloc(instancesLength * 3 * UINT16_SIZE_BYTES);
    for (let i = 0; i < instancesLength; ++i) {
        let position = getPosition(
            i,
            instancesLength,
            tileWidth,
            modelSize,
            transform
        );
        position = Cartesian3.subtract(position, center, position);
        const x = ((position.x - min) * range) / scale;
        const y = ((position.y - min) * range) / scale;
        const z = ((position.z - min) * range) / scale;
        buffer.writeUInt16LE(x, i * 3 * UINT16_SIZE_BYTES);
        buffer.writeUInt16LE(y, (i * 3 + 1) * UINT16_SIZE_BYTES);
        buffer.writeUInt16LE(z, (i * 3 + 2) * UINT16_SIZE_BYTES);
    }
    return {
        buffer: buffer,
        propertyName: 'POSITION_QUANTIZED',
        byteAlignment: UINT16_SIZE_BYTES
    };
}

function getNormal() {
    const x = CesiumMath.nextRandomNumber();
    const y = CesiumMath.nextRandomNumber();
    const z = CesiumMath.nextRandomNumber();

    const normal = new Cartesian3(x, y, z);
    Cartesian3.normalize(normal, normal);
    return normal;
}

function getOrthogonalNormal(normal) {
    const randomNormal = getNormal();
    const orthogonal = Cartesian3.cross(normal, randomNormal, randomNormal);
    return Cartesian3.normalize(orthogonal, orthogonal);
}

function getOrientations(instancesLength) {
    const normalsUpBuffer = Buffer.alloc(
        instancesLength * 3 * FLOAT32_SIZE_BYTES
    );
    const normalsRightBuffer = Buffer.alloc(
        instancesLength * 3 * FLOAT32_SIZE_BYTES
    );
    for (let i = 0; i < instancesLength; ++i) {
        const normalUp = getNormal();
        normalsUpBuffer.writeFloatLE(normalUp.x, i * 3 * FLOAT32_SIZE_BYTES);
        normalsUpBuffer.writeFloatLE(
            normalUp.y,
            (i * 3 + 1) * FLOAT32_SIZE_BYTES
        );
        normalsUpBuffer.writeFloatLE(
            normalUp.z,
            (i * 3 + 2) * FLOAT32_SIZE_BYTES
        );

        const normalRight = getOrthogonalNormal(normalUp);
        normalsRightBuffer.writeFloatLE(
            normalRight.x,
            i * 3 * FLOAT32_SIZE_BYTES
        );
        normalsRightBuffer.writeFloatLE(
            normalRight.y,
            (i * 3 + 1) * FLOAT32_SIZE_BYTES
        );
        normalsRightBuffer.writeFloatLE(
            normalRight.z,
            (i * 3 + 2) * FLOAT32_SIZE_BYTES
        );
    }

    return [
        {
            buffer: normalsUpBuffer,
            propertyName: 'NORMAL_UP',
            byteAlignment: FLOAT32_SIZE_BYTES
        },
        {
            buffer: normalsRightBuffer,
            propertyName: 'NORMAL_RIGHT',
            byteAlignment: FLOAT32_SIZE_BYTES
        }
    ];
}

const scratchEncoded = new Cartesian2();

function getOrientationsOctEncoded(instancesLength) {
    const normalsUpBuffer = Buffer.alloc(
        instancesLength * 2 * UINT16_SIZE_BYTES
    );
    const normalsRightBuffer = Buffer.alloc(
        instancesLength * 2 * UINT16_SIZE_BYTES
    );
    for (let i = 0; i < instancesLength; ++i) {
        const normalUp = getNormal();
        const encodedNormalUp = AttributeCompression.octEncodeInRange(
            normalUp,
            65535,
            scratchEncoded
        );
        normalsUpBuffer.writeUInt16LE(
            encodedNormalUp.x,
            i * 2 * UINT16_SIZE_BYTES
        );
        normalsUpBuffer.writeUInt16LE(
            encodedNormalUp.y,
            (i * 2 + 1) * UINT16_SIZE_BYTES
        );

        const normalRight = getOrthogonalNormal(normalUp);
        const encodedNormalRight = AttributeCompression.octEncodeInRange(
            normalRight,
            65535,
            scratchEncoded
        );
        normalsRightBuffer.writeUInt16LE(
            encodedNormalRight.x,
            i * 2 * UINT16_SIZE_BYTES
        );
        normalsRightBuffer.writeUInt16LE(
            encodedNormalRight.y,
            (i * 2 + 1) * UINT16_SIZE_BYTES
        );
    }

    return [
        {
            buffer: normalsUpBuffer,
            propertyName: 'NORMAL_UP_OCT32P',
            byteAlignment: UINT16_SIZE_BYTES
        },
        {
            buffer: normalsRightBuffer,
            propertyName: 'NORMAL_RIGHT_OCT32P',
            byteAlignment: UINT16_SIZE_BYTES
        }
    ];
}

function getScale(): number {
    return CesiumMath.nextRandomNumber() + 0.5;
}

function getUniformScales(instancesLength) {
    const buffer = Buffer.alloc(instancesLength * FLOAT32_SIZE_BYTES);
    for (let i = 0; i < instancesLength; ++i) {
        buffer.writeFloatLE(getScale(), i * FLOAT32_SIZE_BYTES);
    }
    return {
        buffer: buffer,
        propertyName: 'SCALE',
        byteAlignment: FLOAT32_SIZE_BYTES
    };
}

function getNonUniformScales(instancesLength) {
    const buffer = Buffer.alloc(instancesLength * 3 * FLOAT32_SIZE_BYTES);
    for (let i = 0; i < instancesLength; ++i) {
        buffer.writeFloatLE(getScale(), i * 3 * FLOAT32_SIZE_BYTES);
        buffer.writeFloatLE(getScale(), (i * 3 + 1) * FLOAT32_SIZE_BYTES);
        buffer.writeFloatLE(getScale(), (i * 3 + 2) * FLOAT32_SIZE_BYTES);
    }
    return {
        buffer: buffer,
        propertyName: 'SCALE_NON_UNIFORM',
        byteAlignment: FLOAT32_SIZE_BYTES
    };
}

function getBatchIds(instancesLength: number) {
    let i: number;
    let buffer: Buffer;
    let componentType: string;
    let byteAlignment: number;

    if (instancesLength < 256) {
        buffer = Buffer.alloc(instancesLength * UINT8_SIZE_BYTES);
        for (i = 0; i < instancesLength; ++i) {
            buffer.writeUInt8(i, i * UINT8_SIZE_BYTES);
        }
        componentType = 'UNSIGNED_BYTE';
        byteAlignment = UINT8_SIZE_BYTES;
    } else if (instancesLength < 65536) {
        buffer = Buffer.alloc(instancesLength * UINT16_SIZE_BYTES);
        for (i = 0; i < instancesLength; ++i) {
            buffer.writeUInt16LE(i, i * UINT16_SIZE_BYTES);
        }
        componentType = 'UNSIGNED_SHORT';
        byteAlignment = UINT16_SIZE_BYTES;
    } else {
        buffer = Buffer.alloc(instancesLength * UINT32_SIZE_BYTES);
        for (i = 0; i < instancesLength; ++i) {
            buffer.writeUInt32LE(i, i * UINT32_SIZE_BYTES);
        }
        componentType = 'UNSIGNED_INT';
        byteAlignment = UINT32_SIZE_BYTES;
    }

    return {
        buffer: buffer,
        componentType: componentType,
        propertyName: 'BATCH_ID',
        byteAlignment: byteAlignment
    };
}

export function generateInstancesBatchTable(
    instancesLength: number,
    modelSize: number
) {
    return {
        Height: new Array(instancesLength).fill(modelSize)
    };
}

function generateBatchTableBinary(instancesLength: number) {
    const idBuffer = Buffer.alloc(instancesLength * UINT32_SIZE_BYTES);
    for (let i = 0; i < instancesLength; ++i) {
        idBuffer.writeUInt32LE(i, i * UINT32_SIZE_BYTES);
    }
    const batchTableJson = {
        id: { byteOffset: 0, componentType: 'UNSIGNED_INT', type: 'SCALAR' }
    };
    return { json: batchTableJson, binary: idBuffer };
}
