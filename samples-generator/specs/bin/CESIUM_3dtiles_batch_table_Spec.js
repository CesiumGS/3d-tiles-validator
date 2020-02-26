'use strict';
var minimalTriangleGLTF = require('./minimalTriangleGLTF');
var create3dtilesBatchTableExt = require ('../../lib/create3dtilesBatchTableExt');

describe('CESIUM_3dtiles_batch_table.js', function() {
    var triangleGLTF = minimalTriangleGLTF;
    var humanReadableBatchTableAttributes = {
        cornerName: ['A', 'B', 'C'],
        cornerAstroSign: ['Virgo', 'Scorpio', 'Gemini']
    };

    var sharedBuffer = Buffer.from('abcdefghijklmnopqrstuvwxyz');

    var binaryBatchTableAttributes = {
        aToLInclusive: {
            byteOffset: 0,
            byteLength: 12,
            count: 12,
            componentType: 0x1401,
            type: 'SCALAR'
        },

        mToZInclusive: {
            byteOffset: 12,
            byteLength: 14,
            count: 14,
            componentType: 0x1401,
            type: 'SCALAR'
        }
    };

    var accesorsBeforeExtensionAdded = Object.keys(triangleGLTF.accessors).length;
    var bufferViewsBeforeExtensionAdded = Object.keys(triangleGLTF.bufferViews).length;
    var buffersBeforeExtensionAdded = Object.keys(triangleGLTF.buffers).length;

    beforeEach(function() {
        triangleGLTF = JSON.parse(JSON.stringify(minimalTriangleGLTF));
    });

    function commonHumanReadableAssertions(gltf) {
        expect('extensionsUsed' in gltf).toBe(true);
        expect('extensions' in gltf).toBe(true);
        expect('CESIUM_3dtiles_batch_table' in gltf.extensions).toBe(true);
        var batchTables =  gltf.extensions.CESIUM_3dtiles_batch_table.batchTables;
        expect(batchTables).toBeInstanceOf(Array);
        expect(batchTables.length).toBe(1);

        var table = batchTables[0];
        expect(table.batchLength).toBe(humanReadableBatchTableAttributes.cornerName.length);
        expect(table.properties).toBeInstanceOf(Object);
        expect(table.properties.cornerName.values).toEqual(humanReadableBatchTableAttributes.cornerName);
        expect(table.properties.cornerAstroSign.values).toEqual(humanReadableBatchTableAttributes.cornerAstroSign);
    }

    it('human readable values are directly embedded in properties, buffers / accessors / bufferviews left alone', function() {
        create3dtilesBatchTableExt(triangleGLTF, humanReadableBatchTableAttributes);
        commonHumanReadableAssertions(triangleGLTF);

        expect(Object.keys(triangleGLTF.accessors).length).toBe(accesorsBeforeExtensionAdded);
        expect(Object.keys(triangleGLTF.bufferViews).length).toBe(bufferViewsBeforeExtensionAdded);
        expect(Object.keys(triangleGLTF.buffers).length).toBe(buffersBeforeExtensionAdded);
    });

    it('human readable values are directly embedded in properties, binary data is stored in additional buffer', function() {
        create3dtilesBatchTableExt(triangleGLTF, humanReadableBatchTableAttributes, binaryBatchTableAttributes, sharedBuffer);
        commonHumanReadableAssertions(triangleGLTF);

        // two accessors should have been added, one for each of the new binary batch table attributes
        expect(Object.keys(triangleGLTF.accessors).length).toBe(accesorsBeforeExtensionAdded + 2);
        // two bufferviews should have been added, one for each of the new binary batch table attributes
        expect(Object.keys(triangleGLTF.bufferViews).length).toBe(bufferViewsBeforeExtensionAdded + 2);
        // one buffer should have been added, containing the new buffer
        expect(Object.keys(triangleGLTF.buffers).length).toBe(buffersBeforeExtensionAdded + 1);

        expect(triangleGLTF.buffers[1].byteLength).toEqual(sharedBuffer.length);

        // verify the buffer was written correctly for the binary data
        var newBuffer = triangleGLTF.buffers[1];
        var decodedBase64 = Buffer.from(newBuffer.uri.replace('data:application/octet-stream;base64,', ''), 'base64');
        expect(decodedBase64).toEqual(sharedBuffer);

        // verify the most recently pushed accessors both reference the most recently p
        // bufferviews
        var secondToLastAccessor = triangleGLTF.accessors[accesorsBeforeExtensionAdded];
        var lastAccessor = triangleGLTF.accessors[accesorsBeforeExtensionAdded + 1];
        expect(secondToLastAccessor.bufferView).toBe(bufferViewsBeforeExtensionAdded);
        expect(secondToLastAccessor.byteOffset).toBe(0);
        expect(secondToLastAccessor.componentType).toBe(binaryBatchTableAttributes.aToLInclusive.componentType);
        expect(secondToLastAccessor.type).toBe(binaryBatchTableAttributes.aToLInclusive.type);
        expect(secondToLastAccessor.count).toBe(binaryBatchTableAttributes.aToLInclusive.count);

        expect(lastAccessor.bufferView).toBe(bufferViewsBeforeExtensionAdded + 1);
        expect(lastAccessor.byteOffset).toBe(0);
        expect(lastAccessor.componentType).toBe(binaryBatchTableAttributes.mToZInclusive.componentType);
        expect(lastAccessor.type).toBe(binaryBatchTableAttributes.mToZInclusive.type);
        expect(lastAccessor.count).toBe(binaryBatchTableAttributes.mToZInclusive.count);

        // verify those bufferviews are both referencing `buffer 1`
        var secondToLastBufferView = triangleGLTF.bufferViews[bufferViewsBeforeExtensionAdded];
        var lastBufferView = triangleGLTF.bufferViews[bufferViewsBeforeExtensionAdded + 1];
        expect(secondToLastBufferView.buffer).toBe(1);
        expect(secondToLastBufferView.byteLength).toBe(binaryBatchTableAttributes.aToLInclusive.byteLength);
        expect(secondToLastBufferView.byteOffset).toBe(binaryBatchTableAttributes.aToLInclusive.byteOffset);

        expect(lastBufferView.buffer).toBe(1);
        expect(lastBufferView.byteLength).toBe(binaryBatchTableAttributes.mToZInclusive.byteLength);
        expect(lastBufferView.byteOffset).toBe(binaryBatchTableAttributes.mToZInclusive.byteOffset);
    });
});