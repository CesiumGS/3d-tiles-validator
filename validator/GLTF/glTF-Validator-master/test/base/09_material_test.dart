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
  group('Material', () {
    test('Empty array', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/material/empty.gltf').openRead());

      final context = new Context()
        ..path.add('materials')
        ..addIssue(SchemaError.emptyEntity);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Empty object', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/material/empty_object.gltf').openRead());

      await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);
    });

    test('Custom Property', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/material/custom_property.gltf').openRead());

      final context = new Context()
        ..path.add('materials')
        ..path.add('0')
        ..addIssue(SchemaError.unexpectedProperty, name: 'customProperty');

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Valid', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/material/valid_full.gltf').openRead());

      final result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      expect(result.gltf.materials.toString(),
          '[{pbrMetallicRoughness: {baseColorFactor: [1.0, 0.0, 1.0, 1.0], baseColorTexture: {index: 0, texCoord: 0, extensions: {}}, metallicFactor: 0.5, roughnessFactor: 0.5, metallicRoughnessTexture: {index: 1, texCoord: 1, extensions: {}}, extensions: {}}, normalTexture: {scale: 2.1, index: 2, texCoord: 2, extensions: {}}, occlusionTexture: {strength: 0.5, index: 3, texCoord: 3, extensions: {}}, emissiveTexture: {index: 4, texCoord: 4, extensions: {}}, emissiveFactor: [0.0, 1.0, 0.0], alphaMode: MASK, alphaCutoff: 0.4, doubleSided: true, extensions: {}}]');
    });

    test('Unresolved references', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/material/unresolved_references.gltf').openRead());

      final context = new Context()
        ..path.add('materials')
        ..path.add('0')
        ..path.add('pbrMetallicRoughness')
        ..path.add('baseColorTexture')
        ..addIssue(LinkError.unresolvedReference, name: 'index', args: [0])
        ..path.removeLast()
        ..path.add('metallicRoughnessTexture')
        ..addIssue(LinkError.unresolvedReference, name: 'index', args: [1])
        ..path.removeLast()
        ..path.removeLast()
        ..path.add('normalTexture')
        ..addIssue(LinkError.unresolvedReference, name: 'index', args: [2])
        ..path.removeLast()
        ..path.add('occlusionTexture')
        ..addIssue(LinkError.unresolvedReference, name: 'index', args: [3])
        ..path.removeLast()
        ..path.add('emissiveTexture')
        ..addIssue(LinkError.unresolvedReference, name: 'index', args: [4])
        ..path.removeLast();

      await reader.read();

      expect(reader.context.errors, context.errors);
      expect(reader.context.warnings, context.warnings);
    });
  });
}
