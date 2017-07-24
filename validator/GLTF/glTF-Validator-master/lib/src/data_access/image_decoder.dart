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

library gltf.data_access.image_decoder;

import 'dart:async';
import 'dart:math';
import 'package:gltf/src/gl.dart' as gl;

class ImageInfo {
  final String mimeType;
  final int bits;
  final int format;
  final int width;
  final int height;

  ImageInfo._(this.mimeType, this.bits, this.format, this.width, this.height);

  Map<String, Object> toMap() => <String, Object>{
        'mimeType': mimeType,
        'width': width,
        'height': height,
        'format': format,
        'bits': bits
      };

  static Future<ImageInfo> parseStreamAsync(Stream<List<int>> data) {
    ImageInfoDecoder decoder;
    StreamSubscription<List<int>> subscription;
    final completer = new Completer<ImageInfo>();

    var isDetected = false;

    subscription = data.listen((data) {
      if (!isDetected) {
        if (data.length < 9) {
          subscription.cancel();
          completer.completeError(const UnexpectedEndOfStreamException());
          return;
        } else {
          switch (_detectCodec(data)) {
            case _ImageCodec.JPEG:
              decoder = new JpegInfoDecoder(subscription, completer);
              break;
            case _ImageCodec.PNG:
              decoder = new PngInfoDecoder(subscription, completer);
              break;
            default:
              subscription.cancel();
              completer.completeError(const UnsupportedImageFormatException());
              return;
          }
          isDetected = true;
        }
      }
      decoder.add(data);
    }, onError: (Object e) {
      subscription.cancel();
      completer.completeError(e);
    }, onDone: () {
      decoder.close();
    });

    return completer.future;
  }

  static _ImageCodec _detectCodec(List<int> firstChunk) {
    const JPEG = const <int>[0xFF, 0xD8];
    const PNG = const <int>[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    bool beginsWith(List<int> a, List<int> b) {
      for (var i = 0; i < b.length; i++) {
        if (a[i] != b[i]) {
          return false;
        }
      }
      return true;
    }

    if (beginsWith(firstChunk, JPEG)) {
      return _ImageCodec.JPEG;
    }
    if (beginsWith(firstChunk, PNG)) {
      return _ImageCodec.PNG;
    }
    return null;
  }
}

enum _ImageCodec { JPEG, PNG }

abstract class ImageInfoDecoder implements Sink<List<int>> {
  final Completer<ImageInfo> completer;
  final StreamSubscription<List<int>> subscription;
  ImageInfoDecoder(this.subscription, this.completer);
  String get mimeType;
}

class JpegInfoDecoder extends ImageInfoDecoder {
  @override
  final String mimeType = 'image/jpeg';

  JpegInfoDecoder(StreamSubscription<List<int>> subscription,
      Completer<ImageInfo> completer)
      : super(subscription, completer);

  int _state = 0;
  int _type = 0;
  int _segmentLength = 0;
  int _segmentIndex = 0;
  int _availableDataLength = 0;

  List<int> _sofBuffer;

  @override
  void add(List<int> data) {
    try {
      _add(data);
    } on InvalidDataFormatException catch (e) {
      subscription.cancel();
      completer.completeError(e);
    }
  }

  void _add(List<int> data) {
    var index = 0;

    // States
    const START = 0x00;
    const LENGTH_START = 0x01;
    const LENGTH_END = 0x02;
    const SEGMENT = 0x03;

    const MARKER_START = 0xFF;

    const SOI = 0xD8; // Start of image
    const EOI = 0xD9; // End of image
    const TEM = 0x01; // Temporary AC use

    const RST = 0xD0; // Restart interval termination
    const RST_MASK = 0xF8;

    // Only Start-of-Frame markers contain dimensions:
    // C0-CF, except C4, C8, and CC; DE
    const SOF = 0xC0; // Start of frame
    const SOF_MASK = 0xF0;

    const DHP = 0xDE; // Define hierarchical progression

    const DHT = 0xC4; // Huffman table spec
    const SOF_EXT = 0xC8; // Reserved
    const DAC = 0xCC; // AC spec

    bool isSOF(int marker) =>
        (marker & SOF_MASK == SOF &&
            marker != DHT &&
            marker != SOF_EXT &&
            marker != DAC) ||
        marker == DHP;

    bool hasSegment(int marker) => !(marker == TEM ||
        marker & RST_MASK == RST ||
        marker == SOI ||
        marker == EOI ||
        marker == MARKER_START);

    while (index != data.length) {
      final byte = data[index];
      switch (_state) {
        case START:
          if (byte == MARKER_START) {
            _state = MARKER_START;
          } else {
            throw const InvalidDataFormatException('Invalid start of file.');
          }
          break;

        case MARKER_START:
          if (hasSegment(byte)) {
            _state = LENGTH_START;
            _type = byte;
            _segmentIndex = 0;
            _segmentLength = 0;
          }
          break;

        case LENGTH_START:
          _segmentLength = byte << 8;
          _state = LENGTH_END;
          break;

        case LENGTH_END:
          _segmentLength += byte;
          if (_segmentLength < 2)
            throw const InvalidDataFormatException(
                'Invalid JPEG marker segment length.');
          if (isSOF(_type)) {
            _sofBuffer = new List<int>(_segmentLength - 2);
          }
          _state = SEGMENT;
          break;

        case SEGMENT:
          _availableDataLength =
              min(data.length - index, _segmentLength - _segmentIndex - 2);
          if (isSOF(_type)) {
            _sofBuffer.setRange(_segmentIndex,
                _segmentIndex += _availableDataLength, data, index);

            if (_segmentIndex == _segmentLength - 2) {
              _parseSof(_sofBuffer);
              return;
            }
          } else {
            _segmentIndex += _availableDataLength;
            if (_segmentIndex == _segmentLength - 2) {
              _state = MARKER_START;
            }
          }
          index += _availableDataLength;
          continue;
      }
      index++;
    }
  }

  void _parseSof(List<int> data) {
    subscription.cancel();

    final bits = data[0];
    final height = data[1] << 8 | data[2];
    final width = data[3] << 8 | data[4];

    int format;
    if (data[5] == 3) {
      format = gl.RGB;
    } else if (data[5] == 1) {
      format = gl.LUMINANCE;
    }

    completer.complete(new ImageInfo._(mimeType, bits, format, width, height));
  }

  @override
  void close() {
    subscription.cancel();
    if (!completer.isCompleted)
      completer.completeError(const UnexpectedEndOfStreamException());
  }
}

/*
* TODO Check for non-square pixels (`pHYs`)
*
* TODO Check for custom colorspaces:
*   `cHRM` https://www.w3.org/TR/PNG/#11cHRM
*   `gAMA` https://www.w3.org/TR/PNG/#11gAMA
*   `iCCP` https://www.w3.org/TR/PNG/#11iCCP
*   `sRGB` https://www.w3.org/TR/PNG/#11sRGB
*
* */

class PngInfoDecoder extends ImageInfoDecoder {
  @override
  final String mimeType = 'image/png';

  PngInfoDecoder(StreamSubscription<List<int>> subscription,
      Completer<ImageInfo> completer)
      : super(subscription, completer);

  int _chunkLength = 0;
  int _chunkLengthIndex = 0;

  int _chunkType = 0;
  int _chunkTypeIndex = 0;

  int _chunkCrcIndex = 0;

  int _chunkDataIndex = 0;

  int _state = 0;
  int _availableDataLength = 0;

  bool _hasTrns = false;

  final List<int> _headerChunkData = new List<int>(13); // IHDR length

  @override
  void add(List<int> data) {
    var index = 0;

    const IHDR = 0x49484452;
    const TRNS = 0x74524E53;
    const IDAT = 0x49444154;

    const START = 0;
    const CHUNK_LENGTH = 1;
    const CHUNK_TYPE = 2;
    const CHUNK_DATA = 3;
    const CHUNK_CRC = 4;

    void reset() {
      _chunkLength = 0;
      _chunkLengthIndex = 0;
      _chunkType = 0;
      _chunkTypeIndex = 0;
      _chunkDataIndex = 0;
      _chunkCrcIndex = 0;
    }

    while (index != data.length) {
      final byte = data[index];

      switch (_state) {
        case START:
          index += 8; // skip PNG header, it should be already verified
          _state = CHUNK_LENGTH;
          continue;

        case CHUNK_LENGTH:
          _chunkLength = (_chunkLength << 8) | byte;
          _chunkLengthIndex++;
          if (_chunkLengthIndex == 4) {
            _state = CHUNK_TYPE;
          }
          break;

        case CHUNK_TYPE:
          _chunkType = (_chunkType << 8) | byte;
          _chunkTypeIndex++;
          if (_chunkTypeIndex == 4) {
            if (_chunkType == TRNS) {
              _hasTrns = true;
            } else if (_chunkType == IDAT) {
              _parseIHDR();
              return;
            }

            if (_chunkLength == 0) {
              _state = CHUNK_CRC;
            } else {
              _state = CHUNK_DATA;
            }
          }
          break;

        case CHUNK_DATA:
          _availableDataLength =
              min(data.length - index, _chunkLength - _chunkDataIndex);
          if (_chunkType == IHDR) {
            _headerChunkData.setRange(_chunkDataIndex,
                _chunkDataIndex += _availableDataLength, data, index);
          } else {
            _chunkDataIndex += _availableDataLength;
          }

          if (_chunkDataIndex == _chunkLength) {
            _state = CHUNK_CRC;
          }

          index += _availableDataLength;
          continue;

        case CHUNK_CRC:
          _chunkCrcIndex++;
          if (_chunkCrcIndex == 4) {
            reset();
            _state = CHUNK_LENGTH;
          }
          break;
      }
      index++;
    }
  }

  void _parseIHDR() {
    subscription.cancel();

    final data = _headerChunkData;

    final width = data[0] << 24 | data[1] << 16 | data[2] << 8 | data[3];
    final height = data[4] << 24 | data[5] << 16 | data[6] << 8 | data[7];
    final bits = data[8];

    int format;
    switch (data[9]) {
      case 0: // Greyscale
        format = _hasTrns ? gl.LUMINANCE_ALPHA : gl.LUMINANCE;
        break;
      case 2: // Truecolor
      case 3: // Indexed color
        format = _hasTrns ? gl.RGBA : gl.RGB;
        break;
      case 4: // Greyscale with alpha
        format = gl.LUMINANCE_ALPHA;
        break;
      case 6: // Truecolor with alpha
        format = gl.RGBA;
        break;
    }

    completer.complete(new ImageInfo._(mimeType, bits, format, width, height));
  }

  @override
  void close() {
    subscription.cancel();
    if (!completer.isCompleted)
      completer.completeError(const UnexpectedEndOfStreamException());
  }
}

class UnsupportedImageFormatException implements Exception {
  const UnsupportedImageFormatException();
}

class UnexpectedEndOfStreamException implements Exception {
  const UnexpectedEndOfStreamException();
}

class InvalidDataFormatException implements Exception {
  final String message;
  const InvalidDataFormatException(this.message);

  @override
  String toString() => message;
}
