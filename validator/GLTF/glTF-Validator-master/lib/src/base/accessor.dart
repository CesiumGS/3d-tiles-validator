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

library gltf.core.accessor;

import 'gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;

class Accessor extends GltfChildOfRootProperty implements Linkable {
  final String _bufferViewId;
  final int byteOffset;
  final int byteStride;
  final int componentType;
  final int count;
  final String type;
  final bool normalized;
  final List<num> max;
  final List<num> min;

  int get byteLength =>
      (byteStride > 0
              ? byteStride
              : gl.COMPONENT_TYPE_LENGTHS[componentType] *
                  ACCESSOR_TYPES_LENGTHS[type]) *
          (count - 1) +
      gl.COMPONENT_TYPE_LENGTHS[componentType] * ACCESSOR_TYPES_LENGTHS[type];

  BufferView bufferView;

  Accessor._(
      this._bufferViewId,
      this.byteOffset,
      this.byteStride,
      this.componentType,
      this.count,
      this.type,
      this.normalized,
      this.max,
      this.min,
      String name,
      Map<String, Object> extensions,
      Object extras)
      : super(name, extensions, extras);

  String toString([_]) => super.toString({
        BUFFER_VIEW: _bufferViewId,
        BYTE_OFFSET: byteOffset,
        BYTE_STRIDE: byteStride,
        COMPONENT_TYPE: componentType,
        COUNT: count,
        TYPE: type,
        NORMALIZED: normalized,
        MAX: max,
        MIN: min
      });

  static Accessor fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, ACCESSORS_MEMBERS, context);

    final byteOffset = getInt(map, BYTE_OFFSET, context, req: true, min: 0);
    final byteStride =
        getInt(map, BYTE_STRIDE, context, min: 0, max: 255, def: 0);
    final componentType = getInt(map, COMPONENT_TYPE, context,
        req: true, list: gl.COMPONENT_TYPE_LENGTHS.keys);

    final count = getInt(map, COUNT, context, req: true, min: 1);
    final type = getString(map, TYPE, context,
        req: true, list: ACCESSOR_TYPES_LENGTHS.keys);

    final normalized = getBool(map, NORMALIZED, context, def: false);

    List<num> max;
    List<num> min;
    if (type != null && componentType != null) {
      if (componentType == gl.FLOAT) {
        min = getNumList(map, MIN, context,
            lengthsList: [ACCESSOR_TYPES_LENGTHS[type]], req: true);
        max = getNumList(map, MAX, context,
            lengthsList: [ACCESSOR_TYPES_LENGTHS[type]], req: true);
      } else {
        min = getGlIntList(map, MIN, context,
            req: true,
            length: ACCESSOR_TYPES_LENGTHS[type],
            type: componentType);
        max = getGlIntList(map, MAX, context,
            req: true,
            length: ACCESSOR_TYPES_LENGTHS[type],
            type: componentType);
      }
    }

    if (context.validate) {
      if (normalized && componentType == gl.FLOAT) {
        context.addIssue(GltfWarning.NORMALIZED_FLOAT, name: NORMALIZED);
      }

      if (componentType == gl.UNSIGNED_INT) {
        if (!context.glExtensionsUsed.contains(gl.OES_ELEMENT_INDEX_UINT)) {
          context.addIssue(GltfError.ACCESSOR_UINT_NO_EXT,
              name: COMPONENT_TYPE);
        }
        if (type != SCALAR) {
          context.addIssue(GltfError.ACCESSOR_UINT_NO_SCALAR,
              name: COMPONENT_TYPE);
        }
      }

      if (byteOffset != null &&
          byteStride != null &&
          componentType != null &&
          type != null) {
        final attributeLength = gl.COMPONENT_TYPE_LENGTHS[componentType] *
            ACCESSOR_TYPES_LENGTHS[type];

        if (byteOffset % gl.COMPONENT_TYPE_LENGTHS[componentType] != 0) {
          context.addIssue(GltfError.ACCESSOR_MULTIPLE_COMPONENT_TYPE,
              name: BYTE_OFFSET,
              args: [byteOffset, gl.COMPONENT_TYPE_LENGTHS[componentType]]);
        }

        if (byteStride > 0) {
          if (byteStride < attributeLength) {
            context.addIssue(GltfError.ACCESSOR_SMALL_BYTESTRIDE,
                name: BYTE_STRIDE, args: [byteStride, attributeLength]);
          }

          if (byteStride % gl.COMPONENT_TYPE_LENGTHS[componentType] != 0) {
            context.addIssue(GltfError.ACCESSOR_MULTIPLE_COMPONENT_TYPE,
                name: BYTE_STRIDE,
                args: [byteStride, gl.COMPONENT_TYPE_LENGTHS[componentType]]);
          }
        }
      }
    }
    return new Accessor._(
        getId(map, BUFFER_VIEW, context),
        byteOffset,
        byteStride,
        componentType,
        count,
        type,
        normalized,
        max,
        min,
        getName(map, context),
        getExtensions(map, Accessor, context),
        getExtras(map));
  }

  void link(Gltf gltf, Context context) {
    bufferView = gltf.bufferViews[_bufferViewId];

    if (context.validate && _bufferViewId != null) {
      if (bufferView == null) {
        context.addIssue(GltfError.UNRESOLVED_REFERENCE,
            name: BUFFER_VIEW, args: [_bufferViewId]);
        return;
      }

      if (byteOffset != null &&
          byteStride != null &&
          componentType != null &&
          count != null &&
          type != null) {
        if (byteOffset > bufferView.byteLength) {
          context.addIssue(GltfError.ACCESSOR_TOO_LONG,
              name: BYTE_OFFSET,
              args: [byteOffset, _bufferViewId, bufferView.byteLength]);
        } else if (byteOffset + byteLength > bufferView.byteLength) {
          context.addIssue(GltfError.ACCESSOR_TOO_LONG,
              name: BYTE_LENGTH,
              args: [byteLength, _bufferViewId, bufferView.byteLength]);
        }
      }

      if (byteOffset != null &&
          componentType != null &&
          bufferView.byteOffset != null &&
          (bufferView.byteOffset + byteOffset) %
                  gl.COMPONENT_TYPE_LENGTHS[componentType] !=
              0) {
        context.addIssue(GltfError.ACCESSOR_TOTAL_MULTIPLE_COMPONENT_TYPE,
            name: BYTE_OFFSET,
            args: [
              bufferView.byteOffset + byteOffset,
              gl.COMPONENT_TYPE_LENGTHS[componentType]
            ]);
      }

      if (componentType != null && bufferView.target != null) {
        if (componentType == gl.UNSIGNED_INT &&
            bufferView.target != gl.ELEMENT_ARRAY_BUFFER) {
          context.addIssue(GltfError.ACCESSOR_UINT_NO_ELEMENT_ARRAY,
              name: COMPONENT_TYPE);
        }

        if (bufferView.target == gl.ELEMENT_ARRAY_BUFFER &&
            !gl.ELEMENT_ARRAY_TYPES.contains(componentType)) {
          context.addIssue(GltfError.ACCESSOR_INVALID_ELEMENT_ARRAY_TYPE,
              name: COMPONENT_TYPE, args: [componentType]);
        }

        if (bufferView.target != gl.ARRAY_BUFFER && normalized == true) {
          context.addIssue(GltfWarning.NORMALIZED_NON_ARRAY_BUFFER,
              name: NORMALIZED);
        }
      }
    }
  }
}
