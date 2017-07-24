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

/*
  TODO
  points - warn on duplicates
  lines - degenerate (v(2n)=v(2n+1)), duplicates (incl. reversed)
  line_loop, line_stripe - degenerate (v(n)=v(n+1)),
  triangles - degenerate (v1=v2 | v2=v3 | v1=v3), duplicates (order-aware)
  triangle_strip - degenerate (v1=v2=v3), duplicates (order-aware)
  triangle_fan - ???
 */

/*
  TODO
  warn when there're more than two equal consequential animation frames
  (across all outputs)
 */

/*
  TODO
  warn when interpolation may produce zero-length quaternions
 */

library gltf.data_access.validate_accessors_data;

import 'dart:math';
import 'package:gltf/gltf.dart';
import 'package:gltf/src/base/gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;
import 'package:vector_math/vector_math.dart';

void validateAccessorsData(Gltf gltf, Context context) {
  context.path
    ..clear()
    ..add(ACCESSORS);

  final matrix = new Matrix4.zero();

  gltf.accessors.forEachWithIndices((i, accessor) {
    // Skip broken accessors
    if (accessor.type == null ||
        accessor.componentType == -1 ||
        accessor.count == -1) {
      return;
    }

    if (accessor.isXyzSign && accessor.components != 4) {
      return;
    }

    if (accessor.isUnit && accessor.components > 4) {
      return;
    }

    // Skip empty accessors
    if (accessor.bufferView == null && accessor.sparse == null) {
      return;
    }

    context.path.add(i.toString());

    if (accessor.sparse != null) {
      // Check sparse indices
      final view = accessor.sparse.getIndicesTypedView();
      if (view != null) {
        var index = 0;
        var previousValue = -1;
        for (var value in view) {
          if (previousValue != -1 && value <= previousValue) {
            context.addIssue(DataError.accessorSparseIndicesNonIncreasing,
                args: [index, value, previousValue]);
          }
          if (value > accessor.count - 1) {
            context.addIssue(DataError.accessorSparseIndexOob,
                args: [index, value, previousValue]);
          }
          previousValue = value;
          ++index;
        }
      }
    }

    final components = accessor.components;

    var sum = 0.0;
    var index = 0;
    var componentIndex = 0;

    final iterator = gltf.accessors[i].getElements()?.iterator;
    if (iterator == null) {
      return;
    }

    var hasNext = iterator.moveNext();

    if (accessor.componentType == gl.FLOAT) {
      var previousValue = -1.0;
      while (hasNext) {
        final value = iterator.current.toDouble();

        if (value.isNaN || value.isInfinite) {
          context.addIssue(DataError.accessorInvalidFloat, args: [index]);
        } else {
          if (accessor.min != null) {
            if (value < accessor.min[componentIndex]) {
              context.addIssue(DataError.accessorMinMismatch,
                  name: MIN,
                  args: [value, index, accessor.min[componentIndex]]);
            }
          }

          if (accessor.max != null) {
            if (value > accessor.max[componentIndex]) {
              context.addIssue(DataError.accessorMaxMismatch,
                  name: MAX,
                  args: [value, index, accessor.max[componentIndex]]);
            }
          }

          if (accessor.usage == AccessorUsage.AnimationInput) {
            if (value < 0.0) {
              context.addIssue(DataError.accessorAnimationInputNegative,
                  args: [index, value]);
            } else {
              if (previousValue == -1.0) {
                previousValue = value;
              } else {
                if (value <= previousValue) {
                  context.addIssue(
                      DataError.accessorAnimationInputNonIncreasing,
                      args: [index, value, previousValue]);
                }
                previousValue = value;
              }
            }
          } else if (accessor.usage == AccessorUsage.IBM) {
            matrix.storage[componentIndex] = value;
          } else if (accessor.isUnit) {
            sum += value * value;
          }
        }

        if (++componentIndex == components) {
          if (accessor.usage == AccessorUsage.IBM) {
            if (!isTrsDecomposable(matrix)) {
              context.addIssue(DataError.indecomposableMatrix, args: [index]);
            }
          } else if (accessor.isUnit) {
            if (accessor.isXyzSign) {
              sum -= value * value;
            }

            if (absoluteError(sum, 1.0) > 0.0005) {
              context.addIssue(DataError.accessorNonUnit,
                  args: [index, sqrt(sum)]);
            }
            sum = 0.0;

            if (accessor.isXyzSign && value != 1.0 && value != -1.0) {
              context.addIssue(DataError.accessorInvalidSign,
                  args: [index, value]);
            }
          }

          componentIndex = 0;
        }

        ++index;
        hasNext = iterator.moveNext();
      }
    } else {
      // Accessor with integer data

      var maxVertexIndex = -1;
      if (accessor.usage == AccessorUsage.PrimitiveIndices) {
        // Find min number of vertices that are used by this index buffer
        for (final mesh in gltf.meshes) {
          if (mesh.primitives == null) {
            continue;
          }

          for (final primitive in mesh.primitives) {
            if (primitive.vertexCount != -1 &&
                primitive.indices == accessor &&
                (maxVertexIndex == -1 ||
                    maxVertexIndex > primitive.vertexCount)) {
              maxVertexIndex = primitive.vertexCount;
            }
          }
        }
        --maxVertexIndex;
      }

      while (hasNext) {
        final value = iterator.current;

        if (accessor.min != null) {
          if (value < accessor.min[componentIndex]) {
            context.addIssue(DataError.accessorMinMismatch,
                name: MIN, args: [value, index, accessor.min[componentIndex]]);
          }
        }

        if (accessor.max != null) {
          if (value > accessor.max[componentIndex]) {
            context.addIssue(DataError.accessorMaxMismatch,
                name: MAX, args: [value, index, accessor.max[componentIndex]]);
          }
        }

        if (accessor.usage == AccessorUsage.PrimitiveIndices) {
          if (value > maxVertexIndex) {
            context.addIssue(DataError.accessorIndexOob,
                args: [index, value, maxVertexIndex]);
          }
        } else if (accessor.isUnit) {
          final normalizedValue = accessor.getNormalizedValue(value);
          sum += normalizedValue * normalizedValue;
        }

        if (++componentIndex == components) {
          if (accessor.isUnit) {
            if (absoluteError(sum, 1.0) > 0.0005) {
              context.addIssue(DataError.accessorNonUnit,
                  args: [index, sqrt(sum)]);
            }
            sum = 0.0;
          }

          componentIndex = 0;
        }

        ++index;
        hasNext = iterator.moveNext();
      }
    }

    context.path.removeLast();
  });
}
