'use strict';
var fs = require('fs');
var path = require('path');
var trianglePath = path.join(__dirname, '..', 'data', 'triangle.gltf');
var minimalTriangleGLTF = JSON.parse(fs.readFileSync(trianglePath, 'utf8'));
var createFeatureMetadataExtension = require ('../../lib/createFeatureMetadataExtension');

describe('createFeatureMetadataExtension', function() {
    var triangleGLTF = minimalTriangleGLTF;
    var sharedBuffer = Buffer.from('abcdefghijklmnopqrstuvwxyz');
    var featureTableAttributes = {
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

    var oldAccessorLength = Object.keys(triangleGLTF.accessors).length;
    var oldBufferViewLength = Object.keys(triangleGLTF.bufferViews).length;
    var oldBufferLength = Object.keys(triangleGLTF.buffers).length;
    var gltfWithExt = createFeatureMetadataExtension(triangleGLTF, featureTableAttributes, sharedBuffer);

    it('extensions used / extension keys are present', function() {
        expect('extensionsUsed' in gltfWithExt).toBe(true);
        expect('extensions' in gltfWithExt).toBe(true);
        expect('CESIUM_3dtiles_feature_metadata' in gltfWithExt.extensions).toBe(true);
        var featureTables =  gltfWithExt.extensions.CESIUM_3dtiles_feature_metadata.featureTables;
        expect(featureTables).toBeInstanceOf(Array);
        expect(featureTables.length).toBe(1); // Multiple Batch Table not Supported Yet
    });

    it('has correct number of feature table attributes', function() {
        var table =  gltfWithExt.extensions.CESIUM_3dtiles_feature_metadata.featureTables[0];
        expect(table.featureCount).toBe(featureTableAttributes.cornerName.length);
    });

    it('human readable attributes are detected and left as-is in the ext section', function() {
        var properties =  gltfWithExt.extensions.CESIUM_3dtiles_feature_metadata.featureTables[0].properties;
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
        var accessors = gltfWithExt.accessors;
        expect(accessors.length).toEqual(4);
        expect(Object.keys(gltfWithExt.accessors).length).toBe(oldAccessorLength + 2);
        expect(Object.keys(gltfWithExt.bufferViews).length).toBe(oldBufferViewLength + 2);
        expect(Object.keys(gltfWithExt.buffers).length).toBe(oldBufferLength + 1);
        expect(gltfWithExt.buffers[1].byteLength).toEqual(sharedBuffer.length);

        // verify the buffer was written correctly for the binary data
        var newBuffer = triangleGLTF.buffers[1];
        var decodedBase64 = Buffer.from(newBuffer.uri.replace('data:application/octet-stream;base64,', ''), 'base64');
        expect(decodedBase64).toEqual(sharedBuffer);

        var secondToLastAccessor = gltfWithExt.accessors[oldAccessorLength];
        var lastAccessor = gltfWithExt.accessors[oldAccessorLength + 1];
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
        var secondToLastBufferView = gltfWithExt.bufferViews[oldBufferViewLength];
        var lastBufferView = gltfWithExt.bufferViews[oldBufferViewLength + 1];
        expect(secondToLastBufferView.buffer).toBe(1);
        expect(secondToLastBufferView.byteLength).toBe(featureTableAttributes.aToMInclusive.byteLength);
        expect(secondToLastBufferView.byteOffset).toBe(featureTableAttributes.aToMInclusive.byteOffset);
        expect(lastBufferView.buffer).toBe(1);
        expect(lastBufferView.byteLength).toBe(featureTableAttributes.nToZInclusive.byteLength);
        expect(lastBufferView.byteOffset).toBe(featureTableAttributes.nToZInclusive.byteOffset);

        // verify that references to the binary accessors are in `extensions: {...}`
        var featureTableProperties = gltfWithExt.extensions.CESIUM_3dtiles_feature_metadata.featureTables[0].properties;
        expect(featureTableAttributes.aToMInclusive.name in featureTableProperties).toEqual(true);
        expect(featureTableAttributes.nToZInclusive.name in featureTableProperties).toEqual(true);
        expect(featureTableProperties[featureTableAttributes.aToMInclusive.name].accessor).toBe(oldAccessorLength);
        expect(featureTableProperties[featureTableAttributes.nToZInclusive.name].accessor).toBe(oldAccessorLength + 1);
    });
});