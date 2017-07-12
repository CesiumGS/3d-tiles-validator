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

import 'dart:async';
import 'dart:io';

const files = const <String>[
  "data/khronos/2CylinderEngine/glTF/2CylinderEngine.gltf",
  "data/khronos/Box/glTF/Box.gltf",
  "data/khronos/BoxAnimated/glTF/BoxAnimated.gltf",
  "data/khronos/BoxSemantics/glTF/BoxSemantics.gltf",
  "data/khronos/BoxTextured/glTF/BoxTextured.gltf",
  "data/khronos/BoxWithoutIndices/glTF/BoxWithoutIndices.gltf",
  "data/khronos/Brainsteam/glTF/Brainsteam.gltf",
  "data/khronos/Buggy/glTF/Buggy.gltf",
  "data/khronos/CesiumMan/glTF/CesiumMan.gltf",
  "data/khronos/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf",
  "data/khronos/Duck/glTF/Duck.gltf",
  "data/khronos/GearboxAssy/glTF/GearboxAssy.gltf",
  "data/khronos/Monster/glTF/Monster.gltf",
  "data/khronos/ReciprocatingSaw/glTF/ReciprocatingSaw.gltf",
  "data/khronos/RiggedFigure/glTF/RiggedFigure.gltf",
  "data/khronos/RiggedSimple/glTF/RiggedSimple.gltf",
  "data/khronos/VC/glTF/VC.gltf"
];

const filesEmbedded = const <String>[
  "data/khronos/2CylinderEngine/glTF-Embedded/2CylinderEngine.gltf",
  "data/khronos/Box/glTF-Embedded/Box.gltf",
  "data/khronos/BoxAnimated/glTF-Embedded/BoxAnimated.gltf",
  "data/khronos/BoxSemantics/glTF-Embedded/BoxSemantics.gltf",
  "data/khronos/BoxTextured/glTF-Embedded/BoxTextured.gltf",
  "data/khronos/BoxWithoutIndices/glTF-Embedded/BoxWithoutIndices.gltf",
  "data/khronos/Brainsteam/glTF-Embedded/Brainsteam.gltf",
  "data/khronos/Buggy/glTF-Embedded/Buggy.gltf",
  "data/khronos/CesiumMan/glTF-Embedded/CesiumMan.gltf",
  "data/khronos/CesiumMilkTruck/glTF-Embedded/CesiumMilkTruck.gltf",
  "data/khronos/Duck/glTF-Embedded/Duck.gltf",
  "data/khronos/GearboxAssy/glTF-Embedded/GearboxAssy.gltf",
  "data/khronos/Monster/glTF-Embedded/Monster.gltf",
  "data/khronos/ReciprocatingSaw/glTF-Embedded/ReciprocatingSaw.gltf",
  "data/khronos/RiggedFigure/glTF-Embedded/RiggedFigure.gltf",
  "data/khronos/RiggedSimple/glTF-Embedded/RiggedSimple.gltf",
  "data/khronos/VC/glTF-Embedded/VC.gltf"
];

const filesGlb = const <String>[
  "data/khronos/2CylinderEngine/glTF-Binary/2CylinderEngine.glb",
  "data/khronos/Box/glTF-Binary/Box.glb",
  "data/khronos/BoxAnimated/glTF-Binary/BoxAnimated.glb",
  "data/khronos/BoxSemantics/glTF-Binary/BoxSemantics.glb",
  "data/khronos/BoxTextured/glTF-Binary/BoxTextured.glb",
  "data/khronos/BoxWithoutIndices/glTF-Binary/BoxWithoutIndices.glb",
  "data/khronos/Brainsteam/glTF-Binary/Brainsteam.glb",
  "data/khronos/Buggy/glTF-Binary/Buggy.glb",
  "data/khronos/CesiumMan/glTF-Binary/CesiumMan.glb",
  "data/khronos/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
  "data/khronos/Duck/glTF-Binary/Duck.glb",
  "data/khronos/GearboxAssy/glTF-Binary/GearboxAssy.glb",
  "data/khronos/Monster/glTF-Binary/Monster.glb",
  "data/khronos/ReciprocatingSaw/glTF-Binary/ReciprocatingSaw.glb",
  "data/khronos/RiggedFigure/glTF-Binary/RiggedFigure.glb",
  "data/khronos/RiggedSimple/glTF-Binary/RiggedSimple.glb",
  "data/khronos/VC/glTF-Binary/VC.glb"
];

const filesMatCommon = const <String>[
  "data/khronos/2CylinderEngine/glTF-MaterialsCommon/2CylinderEngine.gltf",
  "data/khronos/Box/glTF-MaterialsCommon/Box.gltf",
  "data/khronos/BoxAnimated/glTF-MaterialsCommon/BoxAnimated.gltf",
  "data/khronos/BoxSemantics/glTF-MaterialsCommon/BoxSemantics.gltf",
  "data/khronos/BoxTextured/glTF-MaterialsCommon/BoxTextured.gltf",
  "data/khronos/BoxWithoutIndices/glTF-MaterialsCommon/BoxWithoutIndices.gltf",
  "data/khronos/Brainsteam/glTF-MaterialsCommon/Brainsteam.gltf",
  "data/khronos/Buggy/glTF-MaterialsCommon/Buggy.gltf",
  "data/khronos/CesiumMan/glTF-MaterialsCommon/CesiumMan.gltf",
  "data/khronos/CesiumMilkTruck/glTF-MaterialsCommon/CesiumMilkTruck.gltf",
  "data/khronos/Duck/glTF-MaterialsCommon/Duck.gltf",
  "data/khronos/GearboxAssy/glTF-MaterialsCommon/GearboxAssy.gltf",
  "data/khronos/Monster/glTF-MaterialsCommon/Monster.gltf",
  "data/khronos/ReciprocatingSaw/glTF-MaterialsCommon/ReciprocatingSaw.gltf",
  "data/khronos/RiggedFigure/glTF-MaterialsCommon/RiggedFigure.gltf",
  "data/khronos/RiggedSimple/glTF-MaterialsCommon/RiggedSimple.gltf",
  "data/khronos/VC/glTF-MaterialsCommon/VC.gltf"
];

const fr24 = const <String>[
  "data/fr24/320.gltf",
  "data/fr24/330.gltf",
  "data/fr24/340.gltf",
  "data/fr24/350.gltf",
  "data/fr24/380.gltf",
  "data/fr24/737.gltf",
  "data/fr24/747.gltf",
  "data/fr24/757.gltf",
  "data/fr24/767.gltf",
  "data/fr24/777.gltf",
  "data/fr24/787.gltf",
  "data/fr24/atr42.gltf",
  "data/fr24/bjet.gltf",
  "data/fr24/c172.gltf",
  "data/fr24/crj700.gltf",
  "data/fr24/crj900.gltf",
  "data/fr24/e170.gltf",
  "data/fr24/e190.gltf",
  "data/fr24/heli.gltf",
  "data/fr24/millennium_falcon.gltf"
];

Future main() async {
  print("Core samples:");
  for (final path in files) {
    await run(path);
  }

  print("Embedded samples:");
  for (final path in filesEmbedded) {
    await run(path);
  }

  print("Binary samples:");
  for (final path in filesGlb) {
    await run(path);
  }

  print("MaterialsCommon samples:");
  for (final path in filesMatCommon) {
    await run(path);
  }

  print("Flightradar24 samples:");
  for (final path in fr24) {
    await run(path);
  }
}

Future run(String filename) async {
  final p = await Process.run(
      Platform.resolvedExecutable, ["--checked", "bin/gltf_validator.dart", "$filename"]);
  stderr.write(p.stderr);
  stdout.write(p.stdout);
}
