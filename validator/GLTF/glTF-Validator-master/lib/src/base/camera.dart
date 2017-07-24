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

library gltf.base.camera;

import 'gltf_property.dart';

class Camera extends GltfChildOfRootProperty {
  final String type;
  final CameraOrthographic orthographic;
  final CameraPerspective perspective;

  Camera._(this.type, this.orthographic, this.perspective, String name,
      Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  @override
  String toString([_]) => super.toString(
      {TYPE: type, ORTHOGRAPHIC: orthographic, PERSPECTIVE: perspective});

  static Camera fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, CAMERA_MEMBERS, context);
    }

    if (context.validate &&
        map.keys.where((key) => CAMERA_TYPES.contains(key)).length > 1) {
      context.addIssue(SchemaError.oneOfMismatch, args: CAMERA_TYPES);
    }

    final type = getString(map, TYPE, context, req: true, list: CAMERA_TYPES);

    CameraOrthographic orthographic;
    CameraPerspective perspective;

    switch (type) {
      case ORTHOGRAPHIC:
        orthographic = getObjectFromInnerMap(
            map, ORTHOGRAPHIC, context, CameraOrthographic.fromMap,
            req: true);
        break;
      case PERSPECTIVE:
        perspective = getObjectFromInnerMap(
            map, PERSPECTIVE, context, CameraPerspective.fromMap,
            req: true);
        break;
    }

    return new Camera._(type, orthographic, perspective, getName(map, context),
        getExtensions(map, Camera, context), getExtras(map));
  }
}

class CameraOrthographic extends GltfProperty {
  final double xmag;
  final double ymag;
  final double zfar;
  final double znear;

  CameraOrthographic._(this.xmag, this.ymag, this.zfar, this.znear,
      Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  static CameraOrthographic fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, CAMERA_ORTHOGRAPHIC_MEMBERS, context);
    }

    final xmag = getFloat(map, XMAG, context, req: true);
    final ymag = getFloat(map, YMAG, context, req: true);

    final zfar = getFloat(map, ZFAR, context, req: true, exclMin: 0.0);
    final znear = getFloat(map, ZNEAR, context, req: true, min: 0.0);

    if (context.validate) {
      if (!zfar.isNaN && !znear.isNaN && zfar <= znear) {
        context.addIssue(SemanticError.cameraZfarLequalZnear);
      }

      if (xmag == 0.0 || ymag == 0.0) {
        context.addIssue(SemanticError.cameraXmagYmagZero);
      }
    }

    return new CameraOrthographic._(xmag, ymag, zfar, znear,
        getExtensions(map, CameraOrthographic, context), getExtras(map));
  }

  @override
  String toString([_]) =>
      super.toString({XMAG: xmag, YMAG: ymag, ZFAR: zfar, ZNEAR: znear});
}

class CameraPerspective extends GltfProperty {
  final double aspectRatio;
  final double yfov;
  final double zfar;
  final double znear;

  CameraPerspective._(this.aspectRatio, this.yfov, this.zfar, this.znear,
      Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  static CameraPerspective fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, CAMERA_PERSPECTIVE_MEMBERS, context);
    }

    final zfar = getFloat(map, ZFAR, context, exclMin: 0.0);
    final znear = getFloat(map, ZNEAR, context, req: true, exclMin: 0.0);

    if (context.validate && !zfar.isNaN && !znear.isNaN && zfar <= znear) {
      context.addIssue(SemanticError.cameraZfarLequalZnear);
    }

    return new CameraPerspective._(
        getFloat(map, ASPECT_RATIO, context, exclMin: 0.0),
        getFloat(map, YFOV, context, req: true, exclMin: 0.0),
        zfar,
        znear,
        getExtensions(map, CameraPerspective, context),
        getExtras(map));
  }

  @override
  String toString([_]) => super.toString(
      {ASPECT_RATIO: aspectRatio, YFOV: yfov, ZFAR: zfar, ZNEAR: znear});
}
