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

library gltf.core.animation;

import 'gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;
import 'package:quiver/core.dart';

class Animation extends GltfChildOfRootProperty implements Linkable {
  final List<AnimationChannel> channels;
  final Map<String, AnimationSampler> samplers;

  Animation._(this.channels, this.samplers, String name,
      Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  String toString([_]) =>
      super.toString({CHANNELS: channels, SAMPLERS: samplers});

  static Animation fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, ANIMATION_MEMBERS, context);

    final channels = <AnimationChannel>[];
    final channelMaps =
        getMapList(map, CHANNELS, context, req: true, minItems: 1);
    if (channelMaps != null) {
      context.path.add(CHANNELS);
      int i = 0;
      for (final channelMap in channelMaps) {
        context.path.add((i++).toString());
        final channel = new AnimationChannel.fromMap(channelMap, context);
        context.path.removeLast();
        channels.add(channel);
      }
      context.path.removeLast();
    }

    final samplers = <String, AnimationSampler>{};
    final samplerMaps = getMap(map, SAMPLERS, context);
    if (samplerMaps.isNotEmpty) {
      context.path.add(SAMPLERS);
      for (final id in samplerMaps.keys) {
        final samplerMap = getMap(samplerMaps, id, context, req: true);
        if (samplerMap == null) continue;
        context.path.add(id);
        samplers[id] = new AnimationSampler.fromMap(samplerMap, context);
        context.path.removeLast();
      }
      context.path.removeLast();
    }

    return new Animation._(channels, samplers, getName(map, context),
        getExtensions(map, Animation, context), getExtras(map));
  }

  void link(Gltf gltf, Context context) {
    context.path.add(SAMPLERS);
    samplers.forEach((id, sampler) {
      sampler.input = gltf.accessors[sampler._inputId];
      sampler.output = gltf.accessors[sampler._outputId];

      if (context.validate) {
        context.path.add(id);
        if (sampler.input == null) {
          context.addIssue(GltfError.UNRESOLVED_REFERENCE,
              name: INPUT, args: [sampler._inputId]);
        } else if (sampler.input.bufferView?.target != null) {
          context.addIssue(
              GltfWarning.ANIMATION_ACCESSOR_WRONG_BUFFER_VIEW_TARGET,
              name: INPUT,
              args: [sampler._inputId]);
        }

        if (sampler.output == null) {
          context.addIssue(GltfError.UNRESOLVED_REFERENCE,
              name: OUTPUT, args: [sampler._outputId]);
        } else if (sampler.output.bufferView?.target != null) {
          context.addIssue(
              GltfWarning.ANIMATION_ACCESSOR_WRONG_BUFFER_VIEW_TARGET,
              name: OUTPUT,
              args: [sampler._outputId]);
        }
        context.path.removeLast();
      }
    });
    context.path.removeLast();

    context.path.add(CHANNELS);
    for (int i = 0; i < channels.length; i++) {
      context.path.add(i.toString());

      final channel = channels[i];
      channel.sampler = samplers[channel._samplerId];

      if (channel.target != null) {
        channel.target.node = gltf.nodes[channel.target.id];
        if (context.validate && channel.target.node == null) {
          context.path.add(TARGET);
          context.addIssue(GltfError.UNRESOLVED_REFERENCE,
              name: ID, args: [channel.target.id]);
          context.path.removeLast();
        }
      }

      if (context.validate) {
        if (channel.sampler == null) {
          context.addIssue(GltfError.UNRESOLVED_REFERENCE,
              name: SAMPLER, args: [channel._samplerId]);
        } else {
          if (channel.sampler.input != null) {
            if (channel.sampler.input.type != SCALAR ||
                channel.sampler.input.componentType != gl.FLOAT ||
                channel.sampler.input.normalized) {
              context.addIssue(GltfError.ANIMATION_SAMPLER_INVALID_INPUT,
                  name: SAMPLER,
                  args: [channel._samplerId, channel.sampler._inputId]);
            }
          }

          if (channel.target != null && channel.sampler.output != null) {
            const outputTypes = const <String, String>{
              TRANSLATION: VEC3,
              ROTATION: VEC4,
              SCALE: VEC3
            };

            if (channel.sampler.output.type !=
                    outputTypes[channel.target.path] ||
                channel.sampler.output.componentType != gl.FLOAT ||
                channel.sampler.output.normalized) {
              context.addIssue(GltfError.ANIMATION_SAMPLER_INVALID_OUTPUT,
                  name: SAMPLER,
                  args: [channel._samplerId, channel.sampler._outputId]);
            }
          }
        }
        for (int j = i + 1; j < channels.length - 1; j++) {
          if (channel.target != null && channel.target == channels[j].target) {
            context.addIssue(GltfError.ANIMATION_DUPLICATE_TARGETS,
                name: TARGET, args: [j]);
          }
        }
        context.path.removeLast();
      }
    }
    context.path.removeLast();
  }
}

class AnimationChannel extends GltfProperty {
  final String _samplerId;
  final AnimationChannelTarget target;

  AnimationSampler sampler;

  AnimationChannel._(this._samplerId, this.target,
      Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  String toString([_]) => super.toString({SAMPLER: _samplerId, TARGET: target});

  factory AnimationChannel.fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, ANIMATION_CHANNEL_MEMBERS, context);

    AnimationChannelTarget target;
    final targetMap = getMap(map, TARGET, context, req: true);
    if (targetMap != null) {
      target = new AnimationChannelTarget.fromMap(targetMap, context);
    }

    return new AnimationChannel._(getId(map, SAMPLER, context), target,
        getExtensions(map, AnimationChannel, context), getExtras(map));
  }
}

class AnimationChannelTarget extends GltfProperty {
  final String id;
  final String path;

  Node node;

  AnimationChannelTarget._(
      this.id, this.path, Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  String toString([_]) => super.toString({ID: id, PATH: path});

  factory AnimationChannelTarget.fromMap(
      Map<String, Object> map, Context context) {
    if (context.validate)
      checkMembers(map, ANIMATION_CHANNEL_TARGET_MEMBERS, context);

    const List<String> propertyNamesEnum = const <String>[
      TRANSLATION,
      ROTATION,
      SCALE
    ];

    return new AnimationChannelTarget._(
        getId(map, ID, context),
        getString(map, PATH, context, req: true, list: propertyNamesEnum),
        getExtensions(map, AnimationChannelTarget, context),
        getExtras(map));
  }

  @override
  int get hashCode => hash2(id.hashCode, path.hashCode);

  @override
  bool operator ==(dynamic o) =>
      o is AnimationChannelTarget && id == o.id && path == o.path;
}

class AnimationSampler extends GltfProperty {
  static const String LINEAR = "LINEAR";
  static const String STEP = "STEP";

  final String _inputId;
  final String interpolation;
  final String _outputId;

  Accessor input;
  Accessor output;

  AnimationSampler._(this._inputId, this.interpolation, this._outputId,
      Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  String toString([_]) => super.toString(
      {INPUT: _inputId, INTERPOLATION: interpolation, OUTPUT: _outputId});

  factory AnimationSampler.fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, ANIMATION_SAMPLER_MEMBERS, context);

    const List<String> interpolationTypesEnum = const <String>[LINEAR, STEP];

    return new AnimationSampler._(
        getId(map, INPUT, context),
        getString(map, INTERPOLATION, context,
            list: interpolationTypesEnum, def: LINEAR),
        getId(map, OUTPUT, context),
        getExtensions(map, AnimationSampler, context),
        getExtras(map));
  }
}
