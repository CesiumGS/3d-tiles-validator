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

library gltf.base.buffer;

import 'dart:typed_data';
import 'gltf_property.dart';

class Buffer extends GltfChildOfRootProperty {
  final Uri uri;
  final int byteLength;

  Uint8List data;

  Buffer._(this.uri, this.data, this.byteLength, String name,
      Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  @override
  String toString([_]) => super.toString({URI: uri, BYTE_LENGTH: byteLength});

  static Buffer fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, BUFFER_MEMBERS, context);
    }

    var byteLength = getUint(map, BYTE_LENGTH, context, min: 1, req: true);

    final uriString = getString(map, URI, context);

    Uri uri;
    Uint8List data;

    if (uriString != null) {
      UriData uriData;
      try {
        uriData = UriData.parse(uriString);
      } on FormatException catch (_) {
        uri = getUri(uriString, context);
      }

      if (uriData != null) {
        if (uriData.mimeType == APPLICATION_OCTET_STREAM) {
          data = uriData.contentAsBytes(); // ignore: invalid_assignment
        } else {
          context.addIssue(SemanticError.bufferDataUriMimeTypeInvalid,
              name: URI, args: [uriData.mimeType]);
        }
      }
      if (data != null && data.length != byteLength) {
        context.addIssue(DataError.bufferEmbeddedBytelengthMismatch,
            args: [data.length, byteLength], name: BYTE_LENGTH);
        byteLength = data.length;
      }
    }

    return new Buffer._(uri, data, byteLength, getName(map, context),
        getExtensions(map, Buffer, context), getExtras(map));
  }
}
