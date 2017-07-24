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
  group('Accessor', () {
    test('Empty array', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/accessor/empty.gltf').openRead());

      final context = new Context()
        ..path.add('accessors')
        ..addIssue(SchemaError.emptyEntity);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Empty object', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/accessor/empty_object.gltf').openRead());

      final context = new Context()
        ..path.add('accessors')
        ..path.add('0')
        ..addIssue(SchemaError.undefinedProperty, name: 'componentType')
        ..addIssue(SchemaError.undefinedProperty, name: 'count')
        ..addIssue(SchemaError.undefinedProperty, name: 'type');

      await reader.read();

      expect(reader.context.errors, context.errors);
      expect(reader.context.warnings, context.warnings);
    });

    test('Custom Property', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/accessor/custom_property.gltf').openRead());

      final context = new Context()
        ..path.add('accessors')
        ..path.add('0')
        ..addIssue(SchemaError.unexpectedProperty, name: 'customProperty');

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Valid', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/accessor/valid_full.gltf').openRead());

      final result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      expect(result.gltf.accessors.toString(),
          '[{bufferView: 0, byteOffset: 0, componentType: 5126, count: 4, type: VEC3, normalized: false, max: [1.0, 1.0, 1.0], min: [0.0, 0.0, 0.0], sparse: {count: 2, indices: {bufferView: 1, byteOffset: 24, componentType: 5121, extensions: {}}, values: {bufferView: 1, byteOffset: 0, extensions: {}}, extensions: {}}, extensions: {}}]');
    });

    test('Unresolved references', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/accessor/unresolved_references.gltf').openRead());

      final context = new Context()
        ..path.add('accessors')
        ..path.add('0')
        ..addIssue(LinkError.unresolvedReference, name: 'bufferView', args: [0])
        ..path.add('sparse')
        ..path.add('indices')
        ..addIssue(LinkError.unresolvedReference, name: 'bufferView', args: [1])
        ..path.removeLast()
        ..path.add('values')
        ..addIssue(LinkError.unresolvedReference,
            name: 'bufferView', args: [1]);

      await reader.read();

      expect(reader.context.errors, context.errors);
      expect(reader.context.warnings, context.warnings);
    });

    test('Alignment', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/accessor/alignment.gltf').openRead());

      final context = new Context()
        ..path.add('accessors')
        ..path.add('0')
        ..addIssue(SemanticError.accessorOffsetAlignment,
            name: 'byteOffset', args: [1, 4])
        ..addIssue(LinkError.accessorTotalOffsetAlignment,
            name: 'byteOffset', args: [3, 4])
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(LinkError.accessorTotalOffsetAlignment,
            name: 'byteOffset', args: [6, 4])
        ..path.removeLast()
        ..path.add('2')
        ..addIssue(LinkError.accessorTotalOffsetAlignment,
            name: 'byteOffset', args: [34, 4])
        ..addIssue(LinkError.accessorTooLong,
            name: 'byteOffset', args: [32, 12, 0, 16])
        ..path.removeLast()
        ..path.add('3')
        ..addIssue(LinkError.accessorTooLong, args: [0, 60, 0, 16]);

      await reader.read();

      expect(reader.context.errors, context.errors);
      expect(reader.context.warnings, context.warnings);
    });

    test('Misc', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/accessor/misc.gltf').openRead());

      final context = new Context()
        ..path.add('accessors')
        ..path.add('0')
        ..addIssue(SchemaError.unsatisfiedDependency,
            name: 'byteOffset', args: ['bufferView'])
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(SemanticError.integerWrittenAsFloat,
            name: 'min', args: [1.0])
        ..path.removeLast()
        ..path.add('2')
        ..addIssue(SemanticError.accessorNormalizedInvalid, name: 'normalized')
        ..path.removeLast()
        ..path.add('3')
        ..addIssue(LinkError.accessorSmallStride, args: [4, 16])
        ..path.removeLast()
        ..path.add('4')
        ..path.add('sparse')
        ..addIssue(SemanticError.accessorSparseCountOutOfRange,
            name: 'count', args: [2, 1])
        ..path.add('indices')
        ..addIssue(SemanticError.bufferViewInvalidByteStride,
            name: 'bufferView')
        ..path.removeLast()
        ..path.add('values')
        ..addIssue(SemanticError.bufferViewInvalidByteStride,
            name: 'bufferView');

      await reader.read();

      expect(reader.context.errors, context.errors);
      expect(reader.context.warnings, context.warnings);
    });

    test('Matrix Alignment', () async {
      final context = new Context()..path.add('accessors');

      final reader = new GltfJsonReader(
          new File('test/base/data/accessor/matrix_alignment.gltf').openRead());
      await reader.read();

      context
        ..path.add('0')
        ..addIssue(SemanticError.accessorMatrixAlignment, name: 'byteOffset')
        ..addIssue(LinkError.accessorTooLong, args: [1, 14, 0, 14])
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(SemanticError.accessorMatrixAlignment, name: 'byteOffset')
        ..addIssue(LinkError.accessorTooLong, args: [2, 23, 0, 14])
        ..path.removeLast()
        ..path.add('2')
        ..addIssue(SemanticError.accessorMatrixAlignment, name: 'byteOffset')
        ..addIssue(LinkError.accessorTooLong, args: [2, 46, 0, 14])
        ..path.removeLast()
        ..path.add('3')
        ..addIssue(SemanticError.accessorMatrixAlignment, name: 'byteOffset')
        ..addIssue(LinkError.accessorTooLong, args: [2, 32, 0, 14])
        ..path.removeLast()
        ..path.add('4')
        ..addIssue(SemanticError.accessorMatrixAlignment, name: 'byteOffset')
        ..addIssue(LinkError.accessorTooLong, args: [2, 64, 0, 14]);

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });
  });
}
