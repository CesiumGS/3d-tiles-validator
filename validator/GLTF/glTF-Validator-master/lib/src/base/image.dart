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

library gltf.core.image;

import 'gltf_property.dart';

class Image extends GltfChildOfRootProperty {
  final String dataString;
  final Uri uri;

  Image._(this.uri, this.dataString, String name,
      Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  String toString([_]) => super.toString({URI: uri});

  static Image fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, IMAGE_MEMBERS, context);

    const List<String> mimeTypesEnum = const <String>[
      "image/bmp",
      "image/gif",
      "image/jpeg",
      "image/png"
    ];

    Uri uri;
    final uriString = getString(map, URI, context, req: true);

    if (uriString != null) {
      if (uriString.startsWith("data:")) {
        if (context.validate) {
          try {
            final uriData = UriData.parse(uriString);
            if (!mimeTypesEnum.contains(uriData.mimeType) &&
                uriData.contentText.isNotEmpty)
              context.addIssue(GltfError.INVALID_DATA_URI_MIME,
                  name: URI, args: [uriData.mimeType]);

            // Decode BASE64 to check encoding
            uriData.contentAsBytes();
          } on FormatException catch (e) {
            context.addIssue(GltfError.INVALID_DATA_URI, name: URI, args: [e]);
          }
        }
      } else {
        uri = parseUri(uriString, context);
      }
    }
    return new Image._(uri, uriString, getName(map, context),
        getExtensions(map, Image, context), getExtras(map));
  }
}
