/*
 * # Copyright (c) 2016-2017 The Khronos Group Inc.
 * # Copyright (c) 2016 Alexey Knyazev
 * #
 * # Licensed under the Apache License, Version 2.0 (the "License");
 * # you may not use this file except in compliance with the License.
 * # You may obtain a copy of the License at
 * #
 * #     http://www.apache.org/licenses/LICENSE-2.0
 * #
 * # Unless required by applicable law or agreed to in writing, software
 * # distributed under the License is distributed on an "AS IS" BASIS,
 * # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * # See the License for the specific language governing permissions and
 * # limitations under the License.
 */

import 'dart:io';

import 'package:test/test.dart';
import 'package:gltf/gltf.dart';
import 'package:gltf/src/errors.dart';

void main() {
  group('Mesh', () {
    test('Empty array', () async {
      final reader =
          new GltfJsonReader(new File('test/base/data/mesh/empty.gltf').openRead());

      final context = new Context()
        ..path.add('meshes')
        ..addIssue(SchemaError.emptyEntity);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Empty object', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/mesh/empty_object.gltf').openRead());

      final context = new Context()
        ..path.add('meshes')
        ..path.add('0')
        ..addIssue(SchemaError.undefinedProperty, name: 'primitives')
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(SchemaError.typeMismatch,
            name: 'primitives', args: ['{}', 'JSON array'])
        ..path.removeLast()
        ..path.add('2')
        ..addIssue(SchemaError.emptyEntity, name: 'primitives')
        ..path.removeLast()
        ..path.add('3')
        ..addIssue(SchemaError.arrayTypeMismatch,
            name: 'primitives', args: ['[]', 'JSON object'])
        ..path.removeLast()
        ..path.add('4')
        ..path.add('primitives')
        ..path.add('0')
        ..addIssue(SchemaError.undefinedProperty, name: 'attributes')
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(SchemaError.typeMismatch,
            name: 'attributes', args: ['[]', 'JSON object'])
        ..addIssue(SchemaError.typeMismatch,
            name: 'targets', args: ['{}', 'JSON array'])
        ..path.removeLast()
        ..path.add('2')
        ..addIssue(SchemaError.emptyEntity, name: 'attributes')
        ..addIssue(SchemaError.emptyEntity, name: 'targets')
        ..path.removeLast()
        ..path.add('3')
        ..addIssue(SchemaError.emptyEntity, name: 'attributes')
        ..addIssue(SchemaError.arrayTypeMismatch,
            name: 'targets', args: ['[]', 'JSON object'])
        ..path.removeLast()
        ..path.add('4')
        ..addIssue(SchemaError.emptyEntity, name: 'attributes')
        ..path.add('targets')
        ..addIssue(SchemaError.emptyEntity, index: 0);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Custom Property', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/mesh/custom_property.gltf').openRead());

      final context = new Context()
        ..path.add('meshes')
        ..path.add('0')
        ..addIssue(SchemaError.unexpectedProperty, name: 'customProperty');

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Unresolved references', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/mesh/unresolved_references.gltf').openRead());

      final context = new Context()
        ..path.add('meshes')
        ..path.add('0')
        ..path.add('primitives')
        ..path.add('0')
        ..addIssue(LinkError.unresolvedReference, name: 'material', args: [0])
        ..addIssue(LinkError.unresolvedReference, name: 'indices', args: [1])
        ..path.add('attributes')
        ..addIssue(LinkError.unresolvedReference, name: 'POSITION', args: [0])
        ..path.removeLast()
        ..path.add('targets')
        ..path.add('0')
        ..addIssue(LinkError.unresolvedReference, name: 'POSITION', args: [2]);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Misc', () async {
      final reader =
          new GltfJsonReader(new File('test/base/data/mesh/misc.gltf').openRead());

      final context = new Context()
        ..path.add('meshes')
        ..path.add('0')
        ..addIssue(SemanticError.meshInvalidWeightsCount,
            name: 'weights', args: [2, 1])
        ..path.add('primitives')
        ..path.add('1')
        ..addIssue(SemanticError.meshPrimitivesUnequalTargetsCount,
            name: 'targets')
        ..path.add('attributes')
        ..addIssue(SemanticError.meshPrimitiveInvalidAttribute,
            args: ['INVALID'])
        ..addIssue(SemanticError.meshPrimitiveInvalidAttribute,
            args: ['INVALID_'])
        ..addIssue(SemanticError.meshPrimitiveInvalidAttribute,
            args: ['INVALID_1_1'])
        ..addIssue(SemanticError.meshPrimitiveInvalidAttribute,
            args: ['INVALID_11'])
        ..addIssue(SemanticError.meshPrimitiveInvalidAttribute,
            args: ['INVALID_D'])
        ..addIssue(SemanticError.meshPrimitiveInvalidAttribute, args: [''])
        ..path.removeLast()
        ..path.removeLast()
        ..path.removeLast()
        ..path.removeLast()
        ..path.add('1')
        ..path.add('primitives')
        ..path.add('0')
        ..path.add('attributes')
        ..addIssue(SemanticError.meshPrimitiveNoPosition)
        ..addIssue(LinkError.meshPrimitiveAttributesAccessorInvalidFormat,
            name: 'NORMAL', args: ['[{VEC3, FLOAT}]', '{VEC2, FLOAT}'])
        ..addIssue(LinkError.meshPrimitiveAccessorUnaligned, name: 'TEXCOORD_0')
        ..addIssue(LinkError.meshPrimitiveUnequalAccessorsCount,
            name: 'TEXCOORD_0')
        ..addIssue(LinkError.meshPrimitiveAttributesAccessorInvalidFormat,
            name: 'TEXCOORD_0',
            args: [
              '[{VEC2, FLOAT}, {VEC2, UNSIGNED_BYTE normalized}, {VEC2, UNSIGNED_SHORT normalized}]',
              '{VEC2, UNSIGNED_SHORT}'
            ])
        ..addIssue(LinkError.meshPrimitiveAccessorUnaligned, name: 'TEXCOORD_1')
        ..addIssue(LinkError.meshPrimitiveAccessorWithoutByteStride,
            name: 'TEXCOORD_1')
        ..path.removeLast()
        ..path.removeLast()
        ..path.removeLast()
        ..path.removeLast()
        ..path.add('2')
        ..path.add('primitives')
        ..path.add('0')
        ..path.add('attributes')
        ..addIssue(SemanticError.meshPrimitiveTangentWithoutNormal)
        ..addIssue(SemanticError.meshPrimitiveTangentPoints)
        ..addIssue(SemanticError.meshPrimitiveJointsWeightsMismatch);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Indices', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/mesh/indices.gltf').openRead());

      final result = await reader.read();

      final context = new Context()
        ..path.add('meshes')
        ..path.add('0')
        ..path.add('primitives')
        ..path.add('0')
        ..addIssue(LinkError.meshPrimitiveIncompatibleMode, args: [4, 4])
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(LinkError.bufferViewTargetOverride,
            name: 'indices', args: ['VertexBuffer', 'IndexBuffer'])
        ..addIssue(LinkError.meshPrimitiveIndicesAccessorWithByteStride,
            name: 'indices')
        ..addIssue(LinkError.meshPrimitiveIndicesAccessorInvalidFormat,
            name: 'indices',
            args: [
              '[{SCALAR, UNSIGNED_BYTE}, {SCALAR, UNSIGNED_SHORT}, {SCALAR, UNSIGNED_INT}]',
              '{SCALAR, FLOAT}'
            ]);

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
      expect(result.gltf.meshes.first.primitives[0].count, 4);
      expect(result.gltf.meshes.first.primitives[1].count, 6);
    });

    test('Morphs', () async {
      final reader =
          new GltfJsonReader(new File('test/base/data/mesh/morphs.gltf').openRead());

      await reader.read();

      final context = new Context()
        ..path.add('meshes')
        ..path.add('0')
        ..path.add('primitives')
        ..path.add('0')
        ..path.add('attributes')
        ..addIssue(LinkError.meshPrimitivePositionAccessorWithoutBounds,
            name: 'POSITION')
        ..path.removeLast()
        ..path.add('targets')
        ..path.add('0')
        ..addIssue(LinkError.meshPrimitivePositionAccessorWithoutBounds,
            name: 'POSITION')
        ..addIssue(LinkError.meshPrimitiveAttributesAccessorInvalidFormat,
            name: 'POSITION', args: ['[{VEC3, FLOAT}]', '{VEC4, FLOAT}'])
        ..path.removeLast()
        ..path.removeLast()
        ..path.removeLast()
        ..path.add('1')
        ..path.add('targets')
        ..path.add('0')
        ..addIssue(LinkError.meshPrimitiveMorphTargetNoBaseAccessor,
            name: 'NORMAL')
        ..addIssue(LinkError.meshPrimitiveMorphTargetInvalidAttributeCount,
            name: 'POSITION');

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Valid', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/mesh/valid_full.gltf').openRead());

      final result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      expect(result.gltf.meshes.toString(),
          '[{primitives: [{attributes: {POSITION: 1}, indices: 0, material: 0, mode: 4, targets: [{POSITION: 2}, {POSITION: 3}], extensions: {}}], weights: [0.7, 0.2], extensions: {}}]');
    });
  });
}
