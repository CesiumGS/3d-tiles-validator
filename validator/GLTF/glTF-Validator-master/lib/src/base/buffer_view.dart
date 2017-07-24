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

library gltf.base.buffer_view;

import 'package:gltf/src/base/gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;

class BufferView extends GltfChildOfRootProperty {
  final int _bufferIndex;
  final int byteOffset;
  final int byteLength;
  final int byteStride;
  final int _target;

  Buffer _buffer;
  BufferViewUsage _usage;

  int effectiveByteStride;

  BufferView._(
      this._bufferIndex,
      this.byteOffset,
      this.byteLength,
      this.byteStride,
      this._target,
      String name,
      Map<String, Object> extensions,
      Object extras)
      : super(name, extensions, extras);

  Buffer get buffer => _buffer;

  BufferViewUsage get usage => _usage;

  int get target => _target != -1 ? _target : usage.target;

  void setUsage(BufferViewUsage value, String name, Context context) {
    if (_usage == null) {
      _usage = value;
    } else if (context.validate && _usage != value) {
      context.addIssue(LinkError.bufferViewTargetOverride,
          name: name, args: [_usage, value]);
    }
  }

  @override
  String toString([_]) => super.toString({
        BUFFER: _bufferIndex,
        BYTE_OFFSET: byteOffset,
        BYTE_LENGTH: byteLength,
        BYTE_STRIDE: byteStride,
        TARGET: _target
      });

  static BufferView fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, BUFFER_VIEW_MEMBERS, context);
    }

    final byteLength = getUint(map, BYTE_LENGTH, context, req: true, min: 1);
    final byteStride = getUint(map, BYTE_STRIDE, context, min: 4, max: 252);
    final target = getUint(map, TARGET, context, list: gl.TARGETS);

    if (context.validate && byteStride != -1) {
      if (byteLength != -1 && byteStride > byteLength) {
        context.addIssue(SemanticError.bufferViewTooBigByteStride,
            name: BYTE_STRIDE, args: [byteStride, byteLength]);
      }

      if (byteStride % 4 != 0) {
        context.addIssue(SchemaError.valueMultipleOf,
            name: BYTE_STRIDE, args: [byteStride, 4]);
      }

      if (target == gl.ELEMENT_ARRAY_BUFFER) {
        context.addIssue(SemanticError.bufferViewInvalidByteStride,
            name: BYTE_STRIDE);
      }
    }

    return new BufferView._(
        getIndex(map, BUFFER, context),
        getUint(map, BYTE_OFFSET, context, min: 0, def: 0),
        byteLength,
        byteStride,
        target,
        getName(map, context),
        getExtensions(map, BufferView, context),
        getExtras(map));
  }

  @override
  void link(Gltf gltf, Context context) {
    _buffer = gltf.buffers[_bufferIndex];

    effectiveByteStride = byteStride;

    if (_target == gl.ARRAY_BUFFER) {
      setUsage(BufferViewUsage.VertexBuffer, null, null);
    } else if (_target == gl.ELEMENT_ARRAY_BUFFER) {
      setUsage(BufferViewUsage.IndexBuffer, null, null);
    }

    if (context.validate && _bufferIndex != -1) {
      if (_buffer == null) {
        context.addIssue(LinkError.unresolvedReference,
            name: BUFFER, args: [_bufferIndex]);
      } else if (_buffer.byteLength != -1) {
        if (byteOffset >= _buffer.byteLength) {
          context.addIssue(LinkError.bufferViewTooLong,
              name: BYTE_OFFSET, args: [_bufferIndex, _buffer.byteLength]);
        } else if (byteOffset + byteLength > _buffer.byteLength) {
          context.addIssue(LinkError.bufferViewTooLong,
              name: BYTE_LENGTH, args: [_bufferIndex, _buffer.byteLength]);
        }
      }
    }
  }
}
