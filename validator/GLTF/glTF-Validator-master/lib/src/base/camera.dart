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

library gltf.core.camera;

import 'gltf_property.dart';

class Camera extends GltfChildOfRootProperty {
  final String type;
  final CameraOrthographic orthographic;
  final CameraPerspective perspective;

  Camera._(
      this.type, String name, Map<String, Object> extensions, Object extras,
      {this.orthographic, this.perspective})
      : super(name, extensions, extras);

  String toString([_]) => super.toString(
      {TYPE: type, ORTHOGRAPHIC: orthographic, PERSPECTIVE: perspective});

  static Camera fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, CAMERA_MEMBERS, context);

    const List<String> types = const <String>[ORTHOGRAPHIC, PERSPECTIVE];

    final type = getString(map, TYPE, context, req: true, list: types);

    final cameraMap = getMap(map, type, context, req: true);

    if (cameraMap != null) {
      context.path.add(type);

      final camera = (type == ORTHOGRAPHIC)
          ? new CameraOrthographic.fromMap(cameraMap, context)
          : (type == PERSPECTIVE)
              ? new CameraPerspective.fromMap(cameraMap, context)
              : null;

      return new Camera._(type, getName(map, context),
          getExtensions(map, Camera, context), getExtras(map),
          orthographic: type == ORTHOGRAPHIC
              ? camera as dynamic/*=CameraOrthographic*/ : null,
          perspective: type == PERSPECTIVE
              ? camera as dynamic/*=CameraPerspective*/ : null);
    } else {
      return new Camera._(type, getName(map, context),
          getExtensions(map, Camera, context), getExtras(map));
    }
  }
}

class CameraOrthographic extends GltfProperty {
  final num xmag;
  final num ymag;
  final num zfar;
  final num znear;

  CameraOrthographic._(this.xmag, this.ymag, this.zfar, this.znear,
      Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  String toString([_]) =>
      super.toString({XMAG: xmag, YMAG: ymag, ZFAR: zfar, ZNEAR: znear});

  factory CameraOrthographic.fromMap(Map<String, Object> map, Context context,
      {String name, Map<String, Object> extensions, Object extras}) {
    if (context.validate)
      checkMembers(map, CAMERA_ORTHOGRAPHIC_MEMBERS, context);

    final zfar = getNum(map, ZFAR, context, req: true, min: 0);
    final znear = getNum(map, ZNEAR, context, req: true, min: 0);

    if (context.validate && zfar != null && zfar <= znear) {
      context.addIssue(GltfError.CAMERA_ZFAR_LEQUAL_ZNEAR);
    }

    return new CameraOrthographic._(getNum(map, XMAG, context, req: true),
        getNum(map, YMAG, context, req: true), zfar, znear, extensions, extras);
  }
}

class CameraPerspective extends GltfProperty {
  final num aspectRatio;
  final num yfov;
  final num zfar;
  final num znear;

  CameraPerspective._(this.aspectRatio, this.yfov, this.zfar, this.znear,
      Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  String toString([_]) => super.toString(
      {ASPECT_RATIO: aspectRatio, YFOV: yfov, ZFAR: zfar, ZNEAR: znear});

  factory CameraPerspective.fromMap(Map<String, Object> map, Context context,
      {String name, Map<String, Object> extensions, Object extras}) {
    if (context.validate)
      checkMembers(map, CAMERA_PERSPECTIVE_MEMBERS, context);

    final zfar = getNum(map, ZFAR, context, req: true, exclMin: 0);
    final znear = getNum(map, ZNEAR, context, req: true, exclMin: 0);

    if (context.validate && zfar != null && zfar <= znear) {
      context.addIssue(GltfError.CAMERA_ZFAR_LEQUAL_ZNEAR);
    }

    return new CameraPerspective._(
        getNum(map, ASPECT_RATIO, context, exclMin: 0),
        getNum(map, YFOV, context, req: true, exclMin: 0),
        zfar,
        znear,
        extensions,
        extras);
  }
}
