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

library gltf.core.buffer_view;

import 'gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;

class BufferView extends GltfChildOfRootProperty implements Linkable {
  final String _bufferId;
  final int byteOffset;
  final int byteLength;
  final int target;

  Buffer buffer;

  BufferView._(this._bufferId, this.byteOffset, this.byteLength, this.target,
      String name, Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  String toString([_]) => super.toString({
        BUFFER: _bufferId,
        BYTE_OFFSET: byteOffset,
        BYTE_LENGTH: byteLength,
        TARGET: target
      });

  static BufferView fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, BUFFER_VIEW_MEMBERS, context);

    return new BufferView._(
        getId(map, BUFFER, context),
        getInt(map, BYTE_OFFSET, context, req: true, min: 0),
        getInt(map, BYTE_LENGTH, context, req: true, min: 0),
        getInt(map, TARGET, context, list: gl.TARGETS),
        getName(map, context),
        getExtensions(map, BufferView, context),
        getExtras(map));
  }

  void link(Gltf gltf, Context context) {
    buffer = gltf.buffers[_bufferId];
    if (context.validate && _bufferId != null) {
      if (buffer == null) {
        context.addIssue(GltfError.UNRESOLVED_REFERENCE,
            name: BUFFER, args: [_bufferId]);
      } else if (byteOffset >= buffer.byteLength) {
        context.addIssue(GltfError.BUFFER_VIEW_TOO_LONG,
            name: BYTE_OFFSET, args: [_bufferId, buffer.byteLength]);
      } else if (byteOffset + byteLength > buffer.byteLength) {
        context.addIssue(GltfError.BUFFER_VIEW_TOO_LONG,
            name: BYTE_LENGTH, args: [_bufferId, buffer.byteLength]);
      }
    }
  }
}
