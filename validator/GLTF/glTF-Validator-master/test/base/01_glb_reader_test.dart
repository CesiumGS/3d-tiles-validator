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

import 'dart:typed_data';
import 'package:test/test.dart';
import 'package:gltf/gltf.dart';
import 'package:gltf/src/errors.dart';

void main() {
  group('GlbReader', () {
    test('Stream Error', () async {
      const ERROR_STRING = 'Stream error throwable';

      StreamController<List<int>> controller;
      controller = new StreamController<List<int>>(onListen: () {
        controller
          ..addError(ERROR_STRING)
          ..close();
      });

      final reader = new GlbReader(controller.stream);

      try {
        await reader.read();
        // ignore: avoid_catches_without_on_clauses
      } catch (e) {
        expect(e, equals(ERROR_STRING));
      }
    });

    test('Zero Stream', () async {
      final glbReader = new GlbReader(new Stream.fromIterable([<int>[]]));
      final context = new Context()
        ..addIssue(GlbError.unexpectedEndOfHeader, offset: 0);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Unexpected end of header', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/no_header.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.unexpectedEndOfHeader, offset: 1);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Invalid magic', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/invalid_magic.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.invalidMagic, offset: 0, args: [0]);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Invalid version', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/invalid_version.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.invalidVersion, offset: 4, args: [0]);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Zero total length', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/zero_length.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.lengthTooSmall, offset: 8, args: [0])
        ..addIssue(GlbError.lengthMismatch, offset: 12, args: [0, 12]);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Only header present', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/only_header.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.lengthTooSmall, offset: 8, args: [12]);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Zero chunk header', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/zero_chunk_header.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.unexpectedFirstChunk,
            offset: 12, args: ['0x00000000'])
        ..addIssue(GlbError.unknownChunkType, offset: 12, args: ['0x00000000']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Unaligned chunk', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/unaligned_chunk.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.chunkLengthUnaligned,
            offset: 12, args: ['0x4e4f534a']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Empty JSON chunk', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/empty_json_chunk.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.emptyChunk, offset: 12, args: ['0x4e4f534a']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Empty JSON object', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/empty_json_object.glb').openRead());

      final context = new Context()
        ..addIssue(SchemaError.undefinedProperty, name: 'asset');

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Invalid JSON chunk', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/invalid_json_chunk.glb').openRead());

      final context = new Context()
        ..addIssue(SchemaError.invalidJson,
            args: ['FormatException: Unexpected character (at offset 1)']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Two valid JSON chunks', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/two_valid_json_chunks.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.duplicateChunk, offset: 48, args: ['0x4e4f534a']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Two empty JSON chunks', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/two_empty_json_chunks.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.emptyChunk, offset: 12, args: ['0x4e4f534a'])
        ..addIssue(GlbError.emptyChunk, offset: 20, args: ['0x4e4f534a'])
        ..addIssue(GlbError.duplicateChunk, offset: 20, args: ['0x4e4f534a'])
        ..addIssue(SchemaError.invalidJson,
            args: ['FormatException: Unexpected end of input (at offset 0)']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Only BIN chunk', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/only_bin_chunk.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.unexpectedFirstChunk,
            offset: 12, args: ['0x004e4942']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Two BIN chunks', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/two_bin_chunks.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.unexpectedFirstChunk,
            offset: 12, args: ['0x004e4942'])
        ..addIssue(GlbError.duplicateChunk, offset: 24, args: ['0x004e4942']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Two empty BIN chunks', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/two_empty_bin_chunks.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.unexpectedFirstChunk,
            offset: 12, args: ['0x004e4942'])
        ..addIssue(GlbError.duplicateChunk, offset: 20, args: ['0x004e4942']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('JSON and two buffers', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/json_and_two_buffers.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.duplicateChunk, offset: 88, args: ['0x004e4942']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Unknown chunk', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/unknown_chunk.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.unexpectedFirstChunk,
            offset: 12, args: ['0x4e4b4e55'])
        ..addIssue(GlbError.unknownChunkType, offset: 12, args: ['0x4e4b4e55']);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Chunk bigger than GLB', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/chunk_too_big.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.chunkTooBig, offset: 12, args: ['0x4e4f534a', 28])
        ..addIssue(GlbError.lengthMismatch, offset: 48, args: [13, 48]);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Truncated chunk header', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/truncated_chunk_header.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.unexpectedEndOfChunkHeader, offset: 13);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Truncated chunk data', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/truncated_chunk_data.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.unexpectedEndOfChunkData, offset: 47);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Total length mismatch', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/length_mismatch.glb').openRead());

      final context = new Context()
        ..addIssue(GlbError.lengthMismatch, offset: 48, args: [49, 48]);

      await glbReader.read();

      expect(glbReader.context.errors, unorderedMatches(context.errors));
      expect(glbReader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Minimal valid GLB', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/valid_minimal.glb').openRead());

      final result = await glbReader.read();

      expect(glbReader.context.errors, isEmpty);
      expect(glbReader.context.warnings, isEmpty);

      expect(result.mimeType, 'model/gltf-binary');
      expect(result.gltf, const isInstanceOf<Gltf>());
      expect(result.buffer, isNull);
    });

    test('Valid GLB with buffer', () async {
      final glbReader = new GlbReader(
          new File('test/base/data/glb/valid_buffer.glb').openRead());

      final result = await glbReader.read();

      expect(glbReader.context.errors, isEmpty);
      expect(glbReader.context.warnings, isEmpty);

      expect(result.mimeType, 'model/gltf-binary');
      expect(result.gltf, const isInstanceOf<Gltf>());
      expect(result.buffer, const isInstanceOf<Uint8List>());
    });
  });
}
