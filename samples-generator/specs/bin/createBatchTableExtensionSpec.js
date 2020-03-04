'use strict';
var fs = require('fs');
var path = require('path');
var trianglePath = path.join(__dirname, '..', 'data', 'triangle.gltf');
var minimalTriangleGLTF = JSON.parse(fs.readFileSync(trianglePath, 'utf8'));
var createBatchTableExtension = require ('../../lib/createBatchTableExtension');

describe('createBatchTableExtension', function() {
    var triangleGLTF = minimalTriangleGLTF;
    var sharedBuffer = Buffer.from('abcdefghijklmnopqrstuvwxyz');
    var batchTableAttributes = {
        aToLInclusive: {
            name: 'aToLInclusive',
            byteOffset: 0,
            byteLength: 12,
            count: 12,
            componentType: 0x1401,
            type: 'SCALAR'
        },

        mToZInclusive: {
            name: 'mToZInclusive',
            byteOffset: 12,
            byteLength: 14,
            count: 14,
            componentType: 0x1401,
            type: 'SCALAR'
        },

        cornerName: ['A', 'B', 'C'],
        cornerAstroSign: ['Virgo', 'Scorpio', 'Gemini']
    };

    var oldAccessorLength = Object.keys(triangleGLTF.accessors).length;
    var oldBufferViewLength = Object.keys(triangleGLTF.bufferViews).length;
    var oldBufferLength = Object.keys(triangleGLTF.buffers).length;
    var gltfWithExt = createBatchTableExtension(triangleGLTF, batchTableAttributes, sharedBuffer);

    it('extensions used / extension keys are present', function() {
        expect('extensionsUsed' in gltfWithExt).toBe(true);
        expect('extensions' in gltfWithExt).toBe(true);
        expect('CESIUM_3dtiles_batch_table' in gltfWithExt.extensions).toBe(true);
        var batchTables =  gltfWithExt.extensions.CESIUM_3dtiles_batch_table.batchTables;
        expect(batchTables).toBeInstanceOf(Array);
        expect(batchTables.length).toBe(1); // Multiple Batch Table not Supported Yet
    });

    it('has correct number of batch table attributes', function() {
        var table =  gltfWithExt.extensions.CESIUM_3dtiles_batch_table.batchTables[0];
        expect(table.batchLength).toBe(batchTableAttributes.cornerName.length);
    });

    it('human readable attributes are detected and left as-is in the ext section', function() {
        var properties =  gltfWithExt.extensions.CESIUM_3dtiles_batch_table.batchTables[0].properties;
        // human readable values are embedded directly
        expect(properties.cornerName.values).toEqual(batchTableAttributes.cornerName);
        expect(properties.cornerAstroSign.values).toEqual(batchTableAttributes.cornerAstroSign);

        // binary values should only have an accessor key
        // accessor ids are sorted by byteOffset, so aToL should be first
        expect(Object.keys(properties.aToLInclusive).length).toEqual(1);
        expect(Object.keys(properties.mToZInclusive).length).toEqual(1);
        expect(properties.aToLInclusive.accessor).toEqual(oldAccessorLength);
        expect(properties.mToZInclusive.accessor).toEqual(oldAccessorLength + 1);
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
        expect(secondToLastAccessor.componentType).toBe(batchTableAttributes.aToLInclusive.componentType);
        expect(secondToLastAccessor.type).toBe(batchTableAttributes.aToLInclusive.type);
        expect(secondToLastAccessor.count).toBe(batchTableAttributes.aToLInclusive.count);

        expect(lastAccessor.bufferView).toBe(oldAccessorLength + 1);
        expect(lastAccessor.byteOffset).toBe(0);
        expect(lastAccessor.componentType).toBe(batchTableAttributes.mToZInclusive.componentType);
        expect(lastAccessor.type).toBe(batchTableAttributes.mToZInclusive.type);
        expect(lastAccessor.count).toBe(batchTableAttributes.mToZInclusive.count);

        // verify those bufferviews are both referencing `buffer 1`
        var secondToLastBufferView = gltfWithExt.bufferViews[oldBufferViewLength];
        var lastBufferView = gltfWithExt.bufferViews[oldBufferViewLength + 1];
        expect(secondToLastBufferView.buffer).toBe(1);
        expect(secondToLastBufferView.byteLength).toBe(batchTableAttributes.aToLInclusive.byteLength);
        expect(secondToLastBufferView.byteOffset).toBe(batchTableAttributes.aToLInclusive.byteOffset);
        expect(lastBufferView.buffer).toBe(1);
        expect(lastBufferView.byteLength).toBe(batchTableAttributes.mToZInclusive.byteLength);
        expect(lastBufferView.byteOffset).toBe(batchTableAttributes.mToZInclusive.byteOffset);

        // verify that references to the binary accessors are in `extensions: {...}`
        var batchTableProperties = gltfWithExt.extensions.CESIUM_3dtiles_batch_table.batchTables[0].properties;
        expect(batchTableAttributes.aToLInclusive.name in batchTableProperties).toBeTrue();
        expect(batchTableAttributes.mToZInclusive.name in batchTableProperties).toBeTrue();
        expect(batchTableProperties[batchTableAttributes.aToLInclusive.name].accessor).toBe(oldAccessorLength);
        expect(batchTableProperties[batchTableAttributes.mToZInclusive.name].accessor).toBe(oldAccessorLength + 1);
    });
});