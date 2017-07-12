/*
 * # Copyright (c) 2016 The Khronos Group Inc.
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

library gltf.extensions.khr_binary_gltf;

import 'errors.dart';
import "package:gltf/src/utils.dart";
import 'package:gltf/src/base/gltf_property.dart';
import 'package:gltf/src/ext/extensions.dart';

// KHR_binary_glTF
const String KHR_BINARY_GLTF = "KHR_binary_glTF";

const String GLB_BUFFER = "binary_glTF";

// KHR_binary_glTF image
const String BUFFER_VIEW = "bufferView";
const String MIME_TYPE = "mimeType";
const String WIDTH = "width";
const String HEIGHT = "height";

const List<String> KHR_BINARY_GLTF_IMAGE_MEMBERS = const <String>[
  BUFFER_VIEW,
  MIME_TYPE,
  WIDTH,
  HEIGHT
];

// KHR_binary_glTF shader
const List<String> KHR_BINARY_GLTF_SHADER_MEMBERS = const <String>[BUFFER_VIEW];

class KhrBinaryGltfImage extends Stringable implements Linkable {
  final String _bufferViewId;
  final String mimeType;
  final int width;
  final int height;

  BufferView bufferView;

  KhrBinaryGltfImage._(
      this._bufferViewId, this.mimeType, this.width, this.height);

  String toString([_]) => super.toString({
        BUFFER_VIEW: _bufferViewId,
        MIME_TYPE: mimeType,
        WIDTH: width,
        HEIGHT: height
      });

  static KhrBinaryGltfImage fromMap(Map<String, Object> map, Context context) {
    if (context.validate)
      checkMembers(map, KHR_BINARY_GLTF_IMAGE_MEMBERS, context);

    return new KhrBinaryGltfImage._(
        getId(map, BUFFER_VIEW, context),
        getId(map, MIME_TYPE, context),
        getInt(map, WIDTH, context, req: true, min: 0),
        getInt(map, HEIGHT, context, req: true, min: 0));
  }

  void link(Gltf gltf, Context context) {
    final bufferView = gltf.bufferViews[_bufferViewId];
    if (bufferView != null)
      this.bufferView = bufferView;
    else
      context.addIssue(GltfError.UNRESOLVED_REFERENCE,
          name: BUFFER_VIEW, args: [_bufferViewId]);
  }
}

class KhrBinaryGltfShader extends Stringable implements Linkable {
  final String _bufferViewId;

  BufferView bufferView;

  KhrBinaryGltfShader._(this._bufferViewId);

  String toString([_]) => super.toString({BUFFER_VIEW: _bufferViewId});

  static KhrBinaryGltfShader fromMap(Map<String, Object> map, Context context) {
    if (context.validate)
      checkMembers(map, KHR_BINARY_GLTF_SHADER_MEMBERS, context);

    return new KhrBinaryGltfShader._(getId(map, BUFFER_VIEW, context));
  }

  void link(Gltf gltf, Context context) {
    bufferView = gltf.bufferViews[_bufferViewId];
    if (bufferView == null)
      context.addIssue(GltfError.UNRESOLVED_REFERENCE,
          name: BUFFER_VIEW, args: [_bufferViewId]);
  }
}

class KhrBinaryGltfBuffer {
  void link(Gltf gltf) {}
}

class KhrBinaryGltfExtension extends Extension {
  final String name = KHR_BINARY_GLTF;

  final Map<Type, ExtFuncs> functions = <Type, ExtFuncs>{
    Image: const ExtFuncs(KhrBinaryGltfImage.fromMap, null),
    Shader: const ExtFuncs(KhrBinaryGltfShader.fromMap, null),
  };

  final Map<String, ErrorFunction> errors = GlbError.messages;
  final Map<String, ErrorFunction> warnings = GlbWarning.messages;

  factory KhrBinaryGltfExtension() => _singleton;

  static KhrBinaryGltfExtension _singleton = new KhrBinaryGltfExtension._();
  KhrBinaryGltfExtension._();
}

class KhrBinaryGltfExtensionOptions implements ExtensionOptions {
  final extension = new KhrBinaryGltfExtension();
  int bufferByteLength;
  KhrBinaryGltfExtensionOptions({this.bufferByteLength});
}

/*// binary_glTF buffer length check
    if (extensionsUsed.contains(KHR_BINARY_GLTF)) {
      if (context.binaryGltfLength > 0) {
        logPath.add(BUFFERS);
        final buffer = buffers[GLB_BUFFER];
        if (buffer != null) {
          if (context.binaryGltfLength != buffer.byteLength) {
            logPath.add(GLB_BUFFER);
            context.addIssue(BYTE_LENGTH, "Binary buffer length mismatch");
            logPath.removeLast();
          }
        } else {
          context.addIssue("@", "No binary buffer found");
        }
        logPath.removeLast();
      }
    }
*/
