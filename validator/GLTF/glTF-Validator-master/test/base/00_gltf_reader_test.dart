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

import 'package:test/test.dart';
import 'package:gltf/gltf.dart';
import 'package:gltf/src/errors.dart';

void main() {
  group('GltfReader', () {
    test('File extensions', () async {
      final gltfReader = new GltfReader(null, null, '.gltf');
      final glbReader = new GltfReader(null, null, '.glb');
      final invalidReader = new GltfReader(null, null, '.glb2');

      expect(gltfReader, const isInstanceOf<GltfJsonReader>());
      expect(glbReader, const isInstanceOf<GlbReader>());
      expect(invalidReader, isNull);
    });

    test('Stream error', () async {
      const ERROR_STRING = 'Stream error throwable';

      StreamController<List<int>> controller;
      controller = new StreamController<List<int>>(onListen: () {
        controller
          ..addError(ERROR_STRING)
          ..close();
      });

      final reader = new GltfReader(controller.stream);

      try {
        await reader.read();
        // ignore: avoid_catches_without_on_clauses
      } catch (e) {
        expect(e, equals(ERROR_STRING));
      }
    });

    test('Empty stream', () async {
      final reader =
          new GltfReader(new Stream<List<int>>.fromIterable([<int>[]]));

      final context = new Context()
        ..addIssue(SchemaError.invalidJson,
            args: ['FormatException: Unexpected end of input (at offset 0)']);

      await reader.read();
      expect(reader.context.errors, unorderedMatches(context.errors));
    });

    test('Invalid stream', () async {
      final reader =
          new GltfReader(new Stream<List<int>>.fromIterable(['{]'.codeUnits]));

      final context = new Context()
        ..addIssue(SchemaError.invalidJson,
            args: ['FormatException: Unexpected character (at offset 1)']);

      await reader.read();
      expect(reader.context.errors, unorderedMatches(context.errors));
    });

    test('Invalid root type', () async {
      final reader =
          new GltfReader(new Stream<List<int>>.fromIterable(['[]'.codeUnits]));

      final context = new Context()
        ..addIssue(SchemaError.typeMismatch, args: ['[]', 'JSON object']);

      await reader.read();
      expect(reader.context.errors, unorderedMatches(context.errors));
    });

    test('Empty root object', () async {
      final reader =
          new GltfReader(new Stream<List<int>>.fromIterable(['{}'.codeUnits]));

      final context = new Context()
        ..addIssue(SchemaError.undefinedProperty, name: 'asset');

      await reader.read();
      expect(reader.context.errors, unorderedMatches(context.errors));
    });

    test('Smallest possible asset', () async {
      final reader = new GltfReader(new Stream<List<int>>.fromIterable(
          ['{"asset":{"version":"2.0"}}'.codeUnits]));

      final result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      expect(result.mimeType, 'model/gltf+json');
      expect(result.gltf, const isInstanceOf<Gltf>());
    });
  });
}
