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
  group('Buffer', () {
    test('Empty array', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/buffer/empty.gltf').openRead());

      final context = new Context()
        ..path.add('buffers')
        ..addIssue(SchemaError.emptyEntity);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Empty object & zero byteLength', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/buffer/empty_object.gltf').openRead());

      final context = new Context()
        ..path.add('buffers')
        ..path.add('0')
        ..addIssue(SchemaError.undefinedProperty, name: 'byteLength')
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(SchemaError.valueNotInRange, name: 'byteLength', args: [0]);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Custom Property', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/buffer/custom_property.gltf').openRead());

      final context = new Context()
        ..path.add('buffers')
        ..path.add('0')
        ..addIssue(SchemaError.unexpectedProperty, name: 'customProperty');

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Valid', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/buffer/valid_full.gltf').openRead());

      final result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      expect(result.gltf.buffers.toString(),
          '[{uri: one_byte.bin, byteLength: 1, extensions: {}}, {byteLength: 1, extensions: {}}]');
    });

    test('Broken URIs', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/buffer/invalid_uris.gltf').openRead());

      final context = new Context()
        ..path.add('buffers')
        ..path.add('0')
        ..addIssue(SchemaError.invalidUri, name: 'uri', args: [
          ':',
          'FormatException: Invalid empty scheme (at character 1)\n:\n^\n'
        ])
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(SchemaError.invalidUri, name: 'uri', args: [
          'data:application/octet-stream;;base64,AA==',
          "FormatException: Expecting '=' (at character 31)\ndata:application/octet-stream;;base64,AA==\n                              ^\n"
        ])
        ..path.removeLast()
        ..path.add('2')
        ..addIssue(SemanticError.bufferDataUriMimeTypeInvalid,
            name: 'uri', args: ['application/octet-stream2'])
        ..path.removeLast()
        ..path.add('3')
        ..addIssue(DataError.bufferEmbeddedBytelengthMismatch,
            name: 'byteLength', args: [1, 2])
        ..path.removeLast()
        ..path.add('4')
        ..addIssue(SemanticError.nonRelativeUri,
            name: 'uri', args: ['http://example.com/buffer.bin']);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });
  });
}
