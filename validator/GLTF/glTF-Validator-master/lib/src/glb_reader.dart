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

library gltf.glb_reader;

import 'dart:async';
import 'dart:math';
import 'dart:typed_data';

import 'package:gltf/gltf.dart';
import 'package:gltf/src/base/gltf_property.dart';
import 'package:meta/meta.dart';

import 'errors.dart';

class GlbReader implements GltfReader {
  static const int _HEADER_LENGTH = 12;

  static const int _CHUNK_HEADER_LENGTH = 8;
  static const int _GLB_VERSION = 2;

  static const int _GLTF_MAGIC = 0x46546C67;

  // States
  static const int _HEADER = 0;
  static const int _CHUNK_HEADER = 1;

  static const int _CHUNK_JSON = 0x4E4F534A;
  static const int _CHUNK_BIN = 0x004E4942;
  static const int _CHUNK_UNKNOWN = 0xFFFFFFFF;

  @override
  final String mimeType = 'model/gltf-binary';
  final Uint8List _header = new Uint8List(_HEADER_LENGTH);

  ByteData _headerByteData;

  final Stream<List<int>> stream;

  StreamSubscription<List<int>> _subscription;
  final Completer<GltfReaderResult> _completer =
      new Completer<GltfReaderResult>();

  Context _context;

  int _state = _HEADER;
  int _localOffset = 0;

  int _offset = 0;
  int _totalLength = 0;

  int _chunkNumber = 0;
  int _chunkLength = 0;
  int _chunkType = 0;

  bool _hasJsonChunk = false;
  GltfJsonReader _jsonReader;
  Future<GltfReaderResult> _jsonReaderResult;
  StreamController<List<int>> _jsonStreamController;

  bool _hasBinChunk = false;
  Uint8List _binaryBuffer;

  GlbReader(this.stream, [Context context]) {
    _context = context ?? new Context();
    _headerByteData = new ByteData.view(_header.buffer);
    _jsonStreamController = new StreamController<List<int>>();
  }

  @override
  Context get context => _context;

  @override
  Future<GltfReaderResult> read() {
    _subscription = stream.listen(_onData, onError: _onError, onDone: _onDone);
    _jsonStreamController
      ..onPause = _subscription.pause
      ..onResume = _subscription.resume
      ..onCancel = () {
        // TODO do we need anything more here?
        if (_jsonStreamController.isClosed) {
          _subscription.resume();
        } else {
          _abort();
        }
      };

    return _completer.future;
  }

  void _abort() {
    _subscription.cancel();
    if (!_completer.isCompleted)
      _completer.complete(new GltfReaderResult(mimeType, null, _binaryBuffer));
  }

  String _getChunkString(int type) =>
      '0x${type.toRadixString(16).padLeft(8, '0')}';

  void _onData(List<int> data) {
    _subscription.pause();
    var dataOffset = 0;
    var availableLength = 0;

    while (dataOffset != data.length) {
      switch (_state) {
        case _HEADER:
          availableLength =
              min(data.length - dataOffset, _HEADER_LENGTH - _localOffset);
          _header.setRange(
              _localOffset, _localOffset += availableLength, data, dataOffset);

          dataOffset += availableLength;
          _offset = availableLength;

          if (_localOffset != _HEADER_LENGTH) {
            break;
          }

          // Check glTF bytes
          final magic = _headerByteData.getUint32(0, Endianness.LITTLE_ENDIAN);
          if (magic != _GLTF_MAGIC) {
            context.addIssue(GlbError.invalidMagic, args: [magic], offset: 0);
            _abort();
            return;
          }

          // Check glTF version
          final version =
              _headerByteData.getUint32(4, Endianness.LITTLE_ENDIAN);
          if (version != _GLB_VERSION) {
            context.addIssue(GlbError.invalidVersion,
                args: [version], offset: 4);
            _abort();
            return;
          }

          _totalLength = _headerByteData.getUint32(8, Endianness.LITTLE_ENDIAN);

          if (_totalLength <= _offset) {
            context.addIssue(GlbError.lengthTooSmall,
                offset: 8, args: [_totalLength]);
          }

          _state = _CHUNK_HEADER;
          _localOffset = 0;

          break;

        case _CHUNK_HEADER:
          availableLength = min(
              data.length - dataOffset, _CHUNK_HEADER_LENGTH - _localOffset);
          _header.setRange(
              _localOffset, _localOffset += availableLength, data, dataOffset);
          dataOffset += availableLength;
          _offset += availableLength;

          if (_localOffset != _CHUNK_HEADER_LENGTH) {
            break;
          }

          _chunkLength = _headerByteData.getUint32(0, Endianness.LITTLE_ENDIAN);
          _chunkType = _headerByteData.getUint32(4, Endianness.LITTLE_ENDIAN);

          if (_chunkLength & 3 != 0) {
            context.addIssue(GlbError.chunkLengthUnaligned,
                offset: _offset - _CHUNK_HEADER_LENGTH,
                args: [_getChunkString(_chunkType)]);
          }

          if (_offset + _chunkLength > _totalLength) {
            context.addIssue(GlbError.chunkTooBig,
                args: [_getChunkString(_chunkType), _chunkLength],
                offset: _offset - _CHUNK_HEADER_LENGTH);
          }

          if (_chunkNumber == 0 && _chunkType != _CHUNK_JSON) {
            context.addIssue(GlbError.unexpectedFirstChunk,
                args: [_getChunkString(_chunkType)],
                offset: _offset - _CHUNK_HEADER_LENGTH);
          }

          void updateState({@required bool seen}) {
            if (seen) {
              context.addIssue(GlbError.duplicateChunk,
                  args: [_getChunkString(_chunkType)],
                  offset: _offset - _CHUNK_HEADER_LENGTH);
              _state = _CHUNK_UNKNOWN;
            } else {
              _state = _chunkType;
            }
          }

          switch (_chunkType) {
            case _CHUNK_JSON:
              // In general, chunks could have valid zero length, but not JSON chunk
              if (_chunkLength == 0) {
                context.addIssue(GlbError.emptyChunk,
                    offset: _offset - _CHUNK_HEADER_LENGTH,
                    args: [_getChunkString(_chunkType)]);
              }
              updateState(seen: _hasJsonChunk);
              _hasJsonChunk = true;
              break;
            case _CHUNK_BIN:
              updateState(seen: _hasBinChunk);
              _hasBinChunk = true;
              break;
            default:
              context.addIssue(GlbError.unknownChunkType,
                  args: [_getChunkString(_chunkType)],
                  offset: _offset - _CHUNK_HEADER_LENGTH);

              _state = _CHUNK_UNKNOWN;
          }

          _chunkNumber++;
          _localOffset = 0;
          break;

        case _CHUNK_JSON:
          availableLength =
              min(data.length - dataOffset, _chunkLength - _localOffset);

          if (_jsonReader == null) {
            _jsonReader =
                new GltfJsonReader(_jsonStreamController.stream, context);
            _jsonReaderResult = _jsonReader.read();
          }

          _jsonStreamController
              .add(data.sublist(dataOffset, dataOffset += availableLength));

          _localOffset += availableLength;
          _offset += availableLength;

          if (_localOffset == _chunkLength) {
            _jsonStreamController.close();
            _state = _CHUNK_HEADER;
            _localOffset = 0;
          }
          break;

        case _CHUNK_BIN:
          availableLength =
              min(data.length - dataOffset, _chunkLength - _localOffset);

          _binaryBuffer ??= new Uint8List(_chunkLength);

          _binaryBuffer.setRange(
              _localOffset, _localOffset += availableLength, data, dataOffset);

          dataOffset += availableLength;
          _offset += availableLength;

          if (_localOffset == _chunkLength) {
            _state = _CHUNK_HEADER;
            _localOffset = 0;
          }
          break;

        case _CHUNK_UNKNOWN:
          availableLength =
              min(data.length - dataOffset, _chunkLength - _localOffset);

          _localOffset += availableLength;
          dataOffset += availableLength;
          _offset += availableLength;

          if (_localOffset == _chunkLength) {
            _state = _CHUNK_HEADER;
            _localOffset = 0;
          }
          break;
      }
    }
    _subscription.resume();
  }

  void _onDone() {
    switch (_state) {
      case _HEADER:
        context.addIssue(GlbError.unexpectedEndOfHeader, offset: _offset);
        _abort();
        break;

      case _CHUNK_HEADER:
        if (_localOffset != 0) {
          context.addIssue(GlbError.unexpectedEndOfChunkHeader,
              offset: _offset);
          _abort();
        } else {
          if (_totalLength != _offset) {
            context.addIssue(GlbError.lengthMismatch,
                args: [_totalLength, _offset], offset: _offset);
          }

          if (_jsonReaderResult != null) {
            _jsonReaderResult.then<Null>((result) {
              _completer.complete(
                  new GltfReaderResult(mimeType, result?.gltf, _binaryBuffer));
            }, onError: _onError);
          } else {
            _completer
                .complete(new GltfReaderResult(mimeType, null, _binaryBuffer));
          }
        }
        break;

      default:
        if (_chunkLength > 0) {
          context.addIssue(GlbError.unexpectedEndOfChunkData, offset: _offset);
        }
        _abort();
    }
  }

  void _onError(Object error) {
    _subscription.cancel();
    if (!_completer.isCompleted) {
      _completer.completeError(error);
    }
  }
}
