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

library gltf.data_access.resources_loader;

import 'dart:async';
import 'package:gltf/gltf.dart';
import 'package:gltf/src/base/gltf_property.dart';
import 'package:gltf/src/data_access/image_decoder.dart';
import 'package:gltf/src/data_access/validate_accessors.dart';
import 'package:meta/meta.dart';

typedef Stream<List<int>> SequentialFetchFunction(Uri uri);
typedef FutureOr<List<int>> BytesFetchFunction(Uri uri);

class ResourcesLoader {
  final Gltf gltf;
  final ValidationResult validationResult;

  final BytesFetchFunction externalBytesFetch;
  final SequentialFetchFunction externalStreamFetch;

  ResourcesLoader(this.validationResult, this.gltf,
      {@required this.externalBytesFetch, @required this.externalStreamFetch});

  Context get _context => validationResult.context;

  Future<Null> load() async {
    await _loadBuffers();
    await _loadImages();
    if (_context.validate) {
      validateAccessorsData(gltf, validationResult.context);
    }
  }

  Future<Null> _loadBuffers() async {
    _context.path
      ..clear()
      ..add(BUFFERS);

    for (var i = 0; i < gltf.buffers.length; i++) {
      final buffer = gltf.buffers[i];
      _context.path.add(i.toString());

      final infoMap = <String, Object>{
        'id': _context.pathString,
        MIME_TYPE: 'application/octet-stream'
      };

      FutureOr<List<int>> _fetchBuffer(Buffer buffer) {
        if (buffer.extensions.isEmpty) {
          if (buffer.uri != null) {
            // External fetch
            return externalBytesFetch(buffer.uri);
          } else if (buffer.data != null) {
            // Data URI
            return buffer.data;
          } else {
            // GLB Buffer
            infoMap['GLB'] = true;
            return externalBytesFetch(null);
          }
        } else {
          throw new UnimplementedError();
        }
      }

      List<int> data;
      try {
        data = await _fetchBuffer(buffer);
      } on Exception catch (e) {
        // likely IO error
        _context.addIssue(IoError.fileNotFound, args: [e]);
      }

      if (data != null) {
        infoMap[BYTE_LENGTH] = data.length;
        if (data.length < buffer.byteLength) {
          _context.addIssue(DataError.bufferExternalBytelengthMismatch,
              args: [data.length, buffer.byteLength]);
        } else {
          // ignore: invalid_assignment
          buffer.data ??= data;
        }
      }
      validationResult.addResource(infoMap);
      _context.path.removeLast();
    }
  }

  Future<Null> _loadImages() async {
    _context.path
      ..clear()
      ..add(IMAGES);

    for (var i = 0; i < gltf.images.length; i++) {
      final image = gltf.images[i];
      _context.path.add(i.toString());

      final infoMap = <String, Object>{'id': _context.pathString};

      Stream<List<int>> _fetchImageData(Image image) {
        if (image.extensions.isEmpty) {
          if (image.uri != null) {
            // External fetch
            return externalStreamFetch(image.uri);
          } else if (image.data != null && image.mimeType != null) {
            // Data URI, preloaded on phase 2 of GltfLoader
            return new Stream.fromIterable([image.data]);
          } else if (image.bufferView != null) {
            // BufferView
            image.tryLoadFromBufferView();
            if (image.data != null) {
              return new Stream.fromIterable([image.data]);
            }
          }
          return null;
        } else {
          throw new UnimplementedError();
        }
      }

      final imageDataStream = _fetchImageData(image);

      ImageInfo imageInfo;
      if (imageDataStream != null) {
        try {
          imageInfo = await ImageInfo.parseStreamAsync(imageDataStream);
        } on UnsupportedImageFormatException catch (_) {
          _context.addIssue(DataError.imageUnrecognizedFormat);
        } on UnexpectedEndOfStreamException catch (_) {
          _context.addIssue(DataError.imageUnexpectedEos);
        } on InvalidDataFormatException catch (e) {
          _context.addIssue(DataError.imageDataInvalid, args: [e]);
        } on Exception catch (e) {
          // likely IO error
          _context.addIssue(IoError.fileNotFound, args: [e]);
        }
        if (imageInfo != null) {
          if (_context.validate) {
            if (image.mimeType != null &&
                (image.mimeType != imageInfo.mimeType)) {
              _context.addIssue(DataError.imageMimeTypeInvalid,
                  args: [imageInfo.mimeType, image.mimeType]);
            }

            if (!isPot(imageInfo.width) || !isPot(imageInfo.height)) {
              _context.addIssue(DataError.imageNonPowerOfTwoDimensions,
                  args: [imageInfo.width, imageInfo.height]);
            }
          }
          infoMap.addAll(imageInfo.toMap());

          image.info = imageInfo;
        }
      }
      validationResult.addResource(infoMap);
      _context.path.removeLast();
    }
  }
}
