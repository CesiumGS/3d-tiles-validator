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

import 'dart:async';
import 'dart:io';

import 'package:test/test.dart';
import 'package:gltf/gltf.dart';
import 'package:gltf/src/errors.dart';

void main() {
  group('glTF', () {
    test('Invalid Collection', () async {
      final json = '{"asset": {"version": "2.0"},"samplers": {}}';
      final reader = new GltfJsonReader(
          new Stream<List<int>>.fromIterable([json.codeUnits]));

      final context = new Context()
        ..addIssue(SchemaError.typeMismatch,
            name: 'samplers', args: ['{}', 'JSON array']);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Invalid Collection Element', () async {
      final json = '{"asset": {"version": "2.0"},"samplers": [[], null]}';
      final reader = new GltfJsonReader(
          new Stream<List<int>>.fromIterable([json.codeUnits]));

      final context = new Context()
        ..path.add('samplers')
        ..addIssue(SchemaError.typeMismatch,
            index: 0, args: ['[]', 'JSON object'])
        ..addIssue(SchemaError.typeMismatch,
            index: 1, args: ['null', 'JSON object']);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Invalid Extensions', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/gltf/invalid_extensions_arrays.gltf').openRead());

      final context = new Context()
        ..addIssue(SchemaError.arrayDuplicateElements,
            name: 'extensionsUsed', args: [1])
        ..addIssue(SchemaError.arrayDuplicateElements,
            name: 'extensionsRequired', args: [1])
        ..addIssue(SemanticError.unusedExtensionRequired,
            name: 'extensionsRequired', args: ['_test_extension2'])
        ..addIssue(LinkError.unsupportedExtension,
            name: 'extensionsUsed', args: ['_test_extension']);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Invalid Extensions Deps', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/gltf/undefined_used_extensions.gltf').openRead());

      final context = new Context()
        ..addIssue(SchemaError.unsatisfiedDependency,
            name: 'extensionsRequired', args: ['extensionsUsed'])
        ..addIssue(SemanticError.unusedExtensionRequired,
            name: 'extensionsRequired', args: ['_test_extension2']);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Valid Full', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/gltf/valid_full.gltf').openRead());

      final result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      expect(result.gltf.toString(),
          '{asset: {version: 2.0, extensions: {}}, accessors: [], animations: [], buffers: [], bufferViews: [], cameras: [], images: [], materials: [], meshes: [], nodes: [], samplers: [], scenes: [], scene: -1, skins: [], textures: [], extensionsRequired: [], extensionsUsed: [], extensions: {}}');
    });
  });
}
