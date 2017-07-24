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
  group('Image', () {
    test('Empty array', () async {
      final reader =
          new GltfJsonReader(new File('test/base/data/image/empty.gltf').openRead());

      final context = new Context()
        ..path.add('images')
        ..addIssue(SchemaError.emptyEntity);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Empty object', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/image/empty_object.gltf').openRead());

      final context = new Context()
        ..path.add('images')
        ..path.add('0')
        ..addIssue(SchemaError.oneOfMismatch, args: ['bufferView', 'uri']);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Custom Property', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/image/custom_property.gltf').openRead());

      final context = new Context()
        ..path.add('images')
        ..path.add('0')
        ..addIssue(SchemaError.unexpectedProperty, name: 'customProperty');

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Valid', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/image/valid_full.gltf').openRead());

      final result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      expect(result.gltf.images.toString(),
          '[{bufferView: -1, uri: pink.png, extensions: {}}, {bufferView: 0, mimeType: image/png, extensions: {}}, {bufferView: -1, mimeType: image/png, extensions: {}}]');
    });

    test('Broken URIs', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/image/invalid_uris.gltf').openRead());

      final context = new Context()
        ..path.add('images')
        ..path.add('0')
        ..addIssue(SchemaError.invalidUri, name: 'uri', args: [
          ':',
          'FormatException: Invalid empty scheme (at character 1)\n:\n^\n'
        ])
        ..path.removeLast()
        ..path.add('1')
        ..addIssue(SchemaError.invalidUri, name: 'uri', args: [
          'data:image/png;;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQYV2P4z/AfAAQAAf+I0P3MAAAAAElFTkSuQmCC',
          "FormatException: Expecting '=' (at character 16)\ndata:image/png;;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElE...\n               ^\n"
        ])
        ..path.removeLast()
        ..path.add('2')
        ..addIssue(SchemaError.invalidUri, name: 'uri', args: [
          'data:image/png;base64,`',
          'FormatException: Invalid base64 data (at character 23)\ndata:image/png;base64,`\n                      ^\n'
        ])
        ..path.removeLast()
        ..path.add('3')
        ..addIssue(SchemaError.valueNotInList,
            name: 'mimeType', args: ['image/gif', '[image/jpeg, image/png]'])
        ..path.removeLast();

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Dependency, unresolved bufferView', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/image/invalid_mime_type_buffer_view.gltf')
              .openRead());

      final context = new Context()
        ..path.add('images')
        ..path.add('0')
        ..addIssue(SchemaError.unsatisfiedDependency,
            name: 'bufferView', args: ['mimeType'])
        ..addIssue(LinkError.unresolvedReference,
            name: 'bufferView', args: [0]);

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Load image from bufferView', () async {
      final reader = new GltfJsonReader(
          new File('test/base/data/image/load_from_buffer_view.gltf').openRead());

      final result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      expect(result.gltf.images.length, 1);
      expect(result.gltf.images[0].mimeType, 'image/png');

      result.gltf.images[0].tryLoadFromBufferView();
      expect(result.gltf.images[0].data.length, 69);
    });
  });
}
