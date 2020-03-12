'use strict';
var createGltfFromPnts = require('../../lib/createGltfFromPnts');
var typeConversion = require('../../lib/typeConversion');

describe('createGltfFromPnts', function() {
    var attributeBuffers = [
        {
            // position
            buffer: Buffer.from([-1, 0, 0, 0, 1, 0, 1, 0, 0]),
            componentType: 'FLOAT',
            propertyName: 'POSITION',
            type: 'VEC3',
            target: 0x8892,
            count: 3,
            min: [-1, 0, 0],
            max: [1, 1, 1]
        },
        {
            // normals
            buffer: Buffer.from([0, 0, 1, 0, 0, 1, 0, 0, 1]),
            componentType: 'FLOAT',
            propertyName: 'NORMAL',
            type: 'VEC3',
            target: 0x8892,
            count: 3,
            min: [0, 0, 1],
            max: [0, 0, 1]
        },
        {
            // colors
            buffer: Buffer.from([255, 0, 0, 0, 255, 0, 0, 0, 255]),
            componentType: 'UNSIGNED_BYTE',
            propertyName: 'RGB',
            type: 'VEC3',
            target: 0x8892,
            count: 3,
            min: [0, 0, 0],
            max: [255, 255, 255]
        }
    ];

    var indexBuffer = {
        buffer: Uint8Array.of(0, 1, 2),
        componentType: 'UNSIGNED_SHORT',
        propertyName: 'INDICES' ,
        type: 'SCALAR',
        target: 0x8893,
        count: 3,
        min: [0],
        max: [2]
    };

    var gltfWithIndex = createGltfFromPnts(attributeBuffers, indexBuffer);

    it('attributeBuffers / indexAttribute is encoded as base64 properly', function() {
        var megaBuffer = Buffer.concat(attributeBuffers.map(function (ab) { return ab.buffer; }));
        megaBuffer = Buffer.concat([megaBuffer, indexBuffer.buffer]);
        var megaBufferBase64 = 'data:application/octet-stream;base64,' + Buffer.from(megaBuffer).toString('base64');
        var buffers = gltfWithIndex.buffers;
        expect(buffers).not.toBeUndefined();
        expect(buffers[0].byteLength).toEqual(megaBuffer.length);
        expect(buffers[0].uri).toEqual(megaBufferBase64);
    });

    it('generated gltf has four bufferviews', function() {
        var bufferViews = gltfWithIndex.bufferViews;
        expect(bufferViews).not.toBeUndefined();
        expect(bufferViews.length).toEqual(attributeBuffers.length + 1);

        var byteOffset = 0;
        var i = 0;
        for (; i < attributeBuffers.length; ++i) {
            expect(bufferViews[i].buffer).toEqual(0);
            expect(bufferViews[i].byteOffset).toEqual(byteOffset);
            expect(bufferViews[i].target).toEqual(attributeBuffers[i].target);
            expect(bufferViews[i].byteLength).toEqual(attributeBuffers[i].buffer.byteLength);
            byteOffset += attributeBuffers[i].buffer.byteLength;
        }

        expect(bufferViews[i].buffer).toEqual(0);
        expect(bufferViews[i].byteOffset).toEqual(byteOffset);
        expect(bufferViews[i].target).toEqual(indexBuffer.target);
        expect(bufferViews[i].byteLength).toEqual(indexBuffer.buffer.byteLength);
    });

    it('generated gltf has four valid accessors', function() {
        expect(gltfWithIndex.accessors).toBeInstanceOf(Array);
        // +1 for the indexBuffer
        expect(gltfWithIndex.accessors.length).toBe(attributeBuffers.length + 1);

        var accessors = gltfWithIndex.accessors;
        var expectedItemCount;
        var i = 0;

        for (i = 0; i < attributeBuffers.length - 1; ++i) {
            expect(accessors[i].bufferView).toEqual(i);
            expect(accessors[i].byteOffset).toEqual(0);
            expect(accessors[i].componentType).toEqual(typeConversion.componentTypeStringToInteger(attributeBuffers[i].componentType));
            expectedItemCount = attributeBuffers[i].buffer.length / typeConversion.elementTypeToCount(attributeBuffers[i].type);
            expect(accessors[i].count).toEqual(expectedItemCount);
        }

        i += 1; // Iterate to to the final bufferAttribute (should be the indexBuffer always)
        expect(accessors[i].bufferView).toEqual(i);
        expect(accessors[i].byteOffset).toEqual(0);
        expect(accessors[i].componentType).toEqual(typeConversion.componentTypeStringToInteger(indexBuffer.componentType));
        expectedItemCount = indexBuffer.buffer.length / typeConversion.elementTypeToCount(indexBuffer.type);
        expect(accessors[i].count).toEqual(expectedItemCount);

    });

    it('generated gltf has a mesh, with valid attributes / indices', function() {
        expect(gltfWithIndex.meshes).toBeInstanceOf(Array);
        expect(gltfWithIndex.meshes[0].primitives).toBeInstanceOf(Array);
        var primitive = gltfWithIndex.meshes[0].primitives[0];
        expect('attributes' in primitive).toBeTrue();
        expect('indices' in primitive).toBeTrue();

        var i = 0;
        for (i = 0; i < attributeBuffers.length; ++i) {
            var propertyName = attributeBuffers[i].propertyName;
            expect(primitive.attributes[propertyName]).toEqual(i);
        }

        expect(primitive.indices).toEqual(i);
    });

    it('has a single node / scene', function() {
        expect(gltfWithIndex.nodes).toBeInstanceOf(Array);
        expect('mesh' in gltfWithIndex.nodes[0]).toBeTrue();
        expect(gltfWithIndex.nodes[0].mesh).toEqual(0);

        expect(gltfWithIndex.scenes).toBeInstanceOf(Array);
        expect('nodes' in gltfWithIndex.scenes[0]).toBeTrue();
        expect(gltfWithIndex.scenes[0].nodes).toEqual([0]);
    });

    it('byteOffset of each accessor is divisible by its componentType', function() {
        var accessors = gltfWithIndex.accessors;
        for (var i = 0; i < accessors.length; ++i) {
            var componentType = accessors[i].componentType;
            var byteOffset = accessors[i].byteOffset;
            var size = typeConversion.webglDataTypeToByteSize(componentType);
            expect(byteOffset / size).toEqual(0);
        }
    });

    it('accessor.byteOffset + bufferView[accessor.bufferView].byteOffset is divisible by size of its componentType', function() {
        var accessors = gltfWithIndex.accessors;
        for (var i = 0; i < accessors.length; ++i) {
            var accessorByteOffset = accessors[i].byteOffset;
            var bufferViewByteOffset = gltfWithIndex.bufferViews[accessors[i].bufferView].byteOffset;
            var sum = accessorByteOffset + bufferViewByteOffset;
            var componentTypeSize = typeConversion.elementTypeToCount(accessors[i].type);
            expect(sum % componentTypeSize).toEqual(0);
        }
    });
});