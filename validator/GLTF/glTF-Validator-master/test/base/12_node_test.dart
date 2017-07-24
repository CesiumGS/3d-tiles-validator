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
  group('Node', () {
    test('Empty array', () async {
      final reader =
          new GltfJsonReader(new File('test/base/data/node/empty.gltf').openRead());

      final context = new Context()
        ..path.add('nodes')
        ..addIssue(SchemaError.emptyEntity);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Custom Property', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/node/custom_property.gltf').openRead());

      final context = new Context()
        ..path.add('nodes')
        ..path.add('0')
        ..addIssue(SchemaError.unexpectedProperty, name: 'customProperty')
        ..addIssue(SemanticError.nodeEmpty);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Unresolved references', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/node/unresolved_references.gltf').openRead());

      final context = new Context()
        ..path.add('nodes')
        ..path.add('0')
        ..addIssue(LinkError.unresolvedReference, name: 'camera', args: [0])
        ..addIssue(LinkError.unresolvedReference, name: 'mesh', args: [0])
        ..addIssue(LinkError.unresolvedReference, name: 'skin', args: [0])
        ..addIssue(SemanticError.nodeEmpty)
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(SchemaError.emptyEntity, name: 'children')
        ..addIssue(SemanticError.nodeEmpty)
        ..path.removeLast()
        ..path.add('2')
        ..path.add('children')
        ..path.add('0')
        ..addIssue(LinkError.unresolvedReference, args: [4]);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Misc', () async {
      final reader =
          new GltfJsonReader(new File('test/base/data/node/misc.gltf').openRead());

      final context = new Context()
        ..path.add('nodes')
        ..path.add('0')
        ..addIssue(SemanticError.nodeRotationNonUnit, name: 'rotation')
        ..addIssue(SchemaError.unsatisfiedDependency,
            name: 'skin', args: ['mesh'])
        ..addIssue(SchemaError.unsatisfiedDependency,
            name: 'weights', args: ['mesh'])
        ..addIssue(SemanticError.nodeMatrixTrs, name: 'matrix')
        ..addIssue(SemanticError.nodeNonTrsMatrix, name: 'matrix')
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(LinkError.nodeWeightsInvalid, name: 'weights', args: [1, 0])
        ..addIssue(LinkError.nodeSkinWithNonSkinnedMesh)
        ..addIssue(SemanticError.nodeDefaultMatrix, name: 'matrix')
        ..path.removeLast()
        ..path.add('2')
        ..path.add('children')
        ..addIssue(LinkError.nodeParentOverride, index: 0, args: [1])
        ..path.removeLast()
        ..path.removeLast()
        ..addIssue(LinkError.nodeLoop, index: 2)
        ..addIssue(LinkError.nodeLoop, index: 3);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Valid', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/node/valid_full.gltf').openRead());

      final result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      expect(result.gltf.nodes.toString(),
          '[{camera: 0, children: [1], skin: 0, matrix: [2.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0], mesh: 0, weights: [0.5], extensions: {}}, {camera: -1, skin: -1, matrix: null, mesh: -1, rotation: 0.0, 0.0, 0.0 @ 1.0, scale: [1.0,1.0,1.0], translation: [0.0,0.0,0.0], extensions: {}}]');
    });
  });
}
