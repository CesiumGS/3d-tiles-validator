import { createFeatureMetadataExtension } from "../../lib/createFeatureMetadataExtension";

const fs = require('fs');
const path = require('path');
const trianglePath = path.join(__dirname, '..', 'data', 'triangle.gltf');
const minimalTriangleGLTF = JSON.parse(fs.readFileSync(trianglePath, 'utf8'));

describe('createFeatureMetadataExtension', function() {
    const triangleGLTF = minimalTriangleGLTF;
    const sharedBuffer = Buffer.from('abcdefghijklmnopqrstuvwxyz');
    const featureTableAttributes = {
        aToMInclusive: {
            name: 'aToMInclusive',
            byteOffset: 0,
            byteLength: 13,
            count: 13,
            componentType: 0x1401,
            type: 'SCALAR'
        },

        nToZInclusive: {
            name: 'nToZInclusive',
            byteOffset: 12,
            byteLength: 13,
            count: 13,
            componentType: 0x1401,
            type: 'SCALAR'
        },

        cornerName: [
            'alfa', 'bravo', 'charlie',
            'delta', 'echo', 'foxtrot',
            'golf', 'hotel', 'india',
            'juliett', 'kilo', 'lima',
            'mike'
        ],

        cornerColor: [
            'red', 'blue', 'green',
            'indgio', 'cyan', 'yellow',
            'periwinkle', 'grey', 'brown',
            'purple', 'magenta', 'lime',
            'orange'
        ]
    };

    const oldAccessorLength = Object.keys(triangleGLTF.accessors).length;
    const oldBufferViewLength = Object.keys(triangleGLTF.bufferViews).length;
    const oldBufferLength = Object.keys(triangleGLTF.buffers).length;
    const gltfWithExt = createFeatureMetadataExtension(triangleGLTF, featureTableAttributes, sharedBuffer);

    it('extensions used / extension keys are present', function() {
        expect('extensionsUsed' in gltfWithExt).toBe(true);
        expect('extensions' in gltfWithExt).toBe(true);
        expect('CESIUM_3dtiles_feature_metadata' in gltfWithExt.extensions).toBe(true);
        const featureTables =  gltfWithExt.extensions.CESIUM_3dtiles_feature_metadata.featureTables;
        expect(featureTables).toBeInstanceOf(Array);
        expect(featureTables.length).toBe(1); // Multiple Batch Table not Supported Yet
    });

    it('has correct number of feature table attributes', function() {
        const table =  gltfWithExt.extensions.CESIUM_3dtiles_feature_metadata.featureTables[0];
        expect(table.featureCount).toBe(featureTableAttributes.cornerName.length);
    });

    it('human readable attributes are detected and left as-is in the ext section', function() {
        const properties =  gltfWithExt.extensions.CESIUM_3dtiles_feature_metadata.featureTables[0].properties;
        // human readable values are embedded directly
        expect(properties.cornerName.values).toEqual(featureTableAttributes.cornerName);
        expect(properties.cornerColor.values).toEqual(featureTableAttributes.cornerColor);

        // binary values should only have an accessor key
        // accessor ids are sorted by byteOffset, so aToL should be first
        expect(Object.keys(properties.aToMInclusive).length).toEqual(1);
        expect(Object.keys(properties.nToZInclusive).length).toEqual(1);
        expect(properties.aToMInclusive.accessor).toEqual(oldAccessorLength);
        expect(properties.nToZInclusive.accessor).toEqual(oldAccessorLength + 1);
    });

    it('buffers / accessors / bufferviews are updated with binary data', function() {
        const accessors = gltfWithExt.accessors;
        expect(accessors.length).toEqual(4);
        expect(Object.keys(gltfWithExt.accessors).length).toBe(oldAccessorLength + 2);
        expect(Object.keys(gltfWithExt.bufferViews).length).toBe(oldBufferViewLength + 2);
        expect(Object.keys(gltfWithExt.buffers).length).toBe(oldBufferLength + 1);
        expect(gltfWithExt.buffers[1].byteLength).toEqual(sharedBuffer.length);

        // verify the buffer was written correctly for the binary data
        const newBuffer = triangleGLTF.buffers[1];
        const decodedBase64 = Buffer.from(newBuffer.uri.replace('data:application/octet-stream;base64,', ''), 'base64');
        expect(decodedBase64).toEqual(sharedBuffer);

        const secondToLastAccessor = gltfWithExt.accessors[oldAccessorLength];
        const lastAccessor = gltfWithExt.accessors[oldAccessorLength + 1];
        expect(secondToLastAccessor.bufferView).toBe(oldAccessorLength);
        expect(secondToLastAccessor.byteOffset).toBe(0);
        expect(secondToLastAccessor.componentType).toBe(featureTableAttributes.aToMInclusive.componentType);
        expect(secondToLastAccessor.type).toBe(featureTableAttributes.aToMInclusive.type);
        expect(secondToLastAccessor.count).toBe(featureTableAttributes.aToMInclusive.count);

        expect(lastAccessor.bufferView).toBe(oldAccessorLength + 1);
        expect(lastAccessor.byteOffset).toBe(0);
        expect(lastAccessor.componentType).toBe(featureTableAttributes.nToZInclusive.componentType);
        expect(lastAccessor.type).toBe(featureTableAttributes.nToZInclusive.type);
        expect(lastAccessor.count).toBe(featureTableAttributes.nToZInclusive.count);

        // verify those bufferviews are both referencing `buffer 1`
        const secondToLastBufferView = gltfWithExt.bufferViews[oldBufferViewLength];
        const lastBufferView = gltfWithExt.bufferViews[oldBufferViewLength + 1];
        expect(secondToLastBufferView.buffer).toBe(1);
        expect(secondToLastBufferView.byteLength).toBe(featureTableAttributes.aToMInclusive.byteLength);
        expect(secondToLastBufferView.byteOffset).toBe(featureTableAttributes.aToMInclusive.byteOffset);
        expect(lastBufferView.buffer).toBe(1);
        expect(lastBufferView.byteLength).toBe(featureTableAttributes.nToZInclusive.byteLength);
        expect(lastBufferView.byteOffset).toBe(featureTableAttributes.nToZInclusive.byteOffset);

        // verify that references to the binary accessors are in `extensions: {...}`
        const featureTableProperties = gltfWithExt.extensions.CESIUM_3dtiles_feature_metadata.featureTables[0].properties;
        expect(featureTableAttributes.aToMInclusive.name in featureTableProperties).toEqual(true);
        expect(featureTableAttributes.nToZInclusive.name in featureTableProperties).toEqual(true);
        expect(featureTableProperties[featureTableAttributes.aToMInclusive.name].accessor).toBe(oldAccessorLength);
        expect(featureTableProperties[featureTableAttributes.nToZInclusive.name].accessor).toBe(oldAccessorLength + 1);
    });
});