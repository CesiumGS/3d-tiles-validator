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

library gltf.base.animation;

import 'package:gltf/src/base/gltf_property.dart';
import 'package:quiver/core.dart';

class Animation extends GltfChildOfRootProperty {
  final SafeList<AnimationChannel> channels;
  final SafeList<AnimationSampler> samplers;

  Animation._(this.channels, this.samplers, String name,
      Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  @override
  String toString([_]) =>
      super.toString({CHANNELS: channels, SAMPLERS: samplers});

  static Animation fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, ANIMATION_MEMBERS, context);
    }

    SafeList<AnimationChannel> channels;
    final channelMaps = getMapList(map, CHANNELS, context);
    if (channelMaps != null) {
      channels = new SafeList<AnimationChannel>(channelMaps.length);
      context.path.add(CHANNELS);
      for (var i = 0; i < channelMaps.length; i++) {
        final channelMap = channelMaps[i];
        context.path.add(i.toString());
        channels[i] = AnimationChannel.fromMap(channelMap, context);
        context.path.removeLast();
      }
      context.path.removeLast();
    }

    SafeList<AnimationSampler> samplers;
    final samplerMaps = getMapList(map, SAMPLERS, context);
    if (samplerMaps != null) {
      samplers = new SafeList<AnimationSampler>(samplerMaps.length);
      context.path.add(SAMPLERS);
      for (var i = 0; i < samplerMaps.length; i++) {
        final samplerMap = samplerMaps[i];
        context.path.add(i.toString());
        samplers[i] = AnimationSampler.fromMap(samplerMap, context);
        context.path.removeLast();
      }
      context.path.removeLast();
    }

    return new Animation._(channels, samplers, getName(map, context),
        getExtensions(map, Animation, context), getExtras(map));
  }

  @override
  void link(Gltf gltf, Context context) {
    if (samplers == null || channels == null) {
      return;
    }

    context.path.add(SAMPLERS);
    samplers.forEachWithIndices((i, sampler) {
      context.path.add(i.toString());

      sampler
        .._input = gltf.accessors[sampler._inputIndex]
        .._output = gltf.accessors[sampler._outputIndex];

      if (sampler._inputIndex != -1) {
        if (sampler._input == null) {
          context.addIssue(LinkError.unresolvedReference,
              name: INPUT, args: [sampler._inputIndex]);
        } else {
          sampler._input.setUsage(AccessorUsage.AnimationInput, INPUT, context);
          sampler._input.bufferView
              ?.setUsage(BufferViewUsage.Other, INPUT, context);

          if (context.validate) {
            final inputFormat = new AccessorFormat.fromAccessor(sampler._input);
            if (inputFormat != ANIMATION_SAMPLER_INPUT_FORMAT) {
              context.addIssue(
                  LinkError.animationSamplerInputAccessorInvalidFormat,
                  name: INPUT,
                  args: [
                    [ANIMATION_SAMPLER_INPUT_FORMAT],
                    inputFormat
                  ]);
            }

            if (sampler._input.min == null || sampler._input.max == null) {
              context.addIssue(
                  LinkError.animationSamplerInputAccessorWithoutBounds,
                  name: INPUT);
            }
          }
        }
      }

      if (sampler._outputIndex != -1) {
        if (sampler._output == null) {
          context.addIssue(LinkError.unresolvedReference,
              name: OUTPUT, args: [sampler._outputIndex]);
        } else {
          sampler._output
              .setUsage(AccessorUsage.AnimationOutput, OUTPUT, context);
          sampler._output.bufferView
              ?.setUsage(BufferViewUsage.Other, OUTPUT, context);
        }
      }

      context.path.removeLast();
    });

    context.path
      ..removeLast()
      ..add(CHANNELS);

    channels.forEachWithIndices((i, channel) {
      context.path.add(i.toString());

      channel._sampler = samplers[channel._samplerIndex];

      if (channel.target != null) {
        channel.target._node = gltf.nodes[channel.target._nodeIndex];
        if (context.validate && channel.target._nodeIndex != -1) {
          context.path.add(TARGET);
          if (channel.target._node == null) {
            context.addIssue(LinkError.unresolvedReference,
                name: NODE, args: [channel.target._nodeIndex]);
          } else {
            switch (channel.target.path) {
              case TRANSLATION:
              case ROTATION:
              case SCALE:
                if (channel.target._node.matrix != null) {
                  context.addIssue(LinkError.animationChannelTargetNodeMatrix);
                }
                break;
              case WEIGHTS:
                if (channel.target._node?.mesh?.primitives?.first?.targets ==
                    null) {
                  context.addIssue(
                      LinkError.animationChannelTargetNodeWeightsNoMorphs);
                }
                break;
            }
          }
          context.path.removeLast();
        }
      }

      if (channel._samplerIndex != -1) {
        if (channel._sampler == null) {
          context.addIssue(LinkError.unresolvedReference,
              name: SAMPLER, args: [channel._samplerIndex]);
        } else {
          if (channel.target != null && channel._sampler._output != null) {
            if (channel.target.path == ROTATION) {
              channel._sampler._output.setUnit();
            }

            if (context.validate) {
              final outputFormat =
                  new AccessorFormat.fromAccessor(channel._sampler._output);
              final validFormats =
                  ANIMATION_SAMPLER_OUTPUT_FORMATS[channel.target.path];

              if (validFormats?.contains(outputFormat) == false) {
                context.addIssue(
                    LinkError.animationSamplerOutputAccessorInvalidFormat,
                    name: SAMPLER,
                    args: [channel.target.path, validFormats, outputFormat]);
              }

              if (channel._sampler._input?.count != -1 &&
                  channel._sampler._output.count != -1 &&
                  channel._sampler.interpolation != null) {
                var outputCount = channel._sampler._input.count;

                if (channel._sampler.interpolation == CUBICSPLINE) {
                  outputCount *= 3;
                } else if (channel._sampler.interpolation == CATMULLROMSPLINE) {
                  outputCount += 2;
                }

                if (channel.target.path == WEIGHTS) {
                  final targetsCount = channel
                      .target._node?.mesh?.primitives?.first?.targets?.length;
                  outputCount *= targetsCount ?? 0;
                }

                if (outputCount != channel._sampler._output.count) {
                  context.addIssue(
                      LinkError.animationSamplerOutputAccessorInvalidCount,
                      name: SAMPLER,
                      args: [outputCount, channel._sampler._output.count]);
                }
              }
            }
          }
        }

        for (var j = i + 1; j < channels.length; j++) {
          if (channel.target != null && channel.target == channels[j].target) {
            context.addIssue(LinkError.animationDuplicateTargets,
                name: TARGET, args: [j]);
          }
        }
        context.path.removeLast();
      }
    });
    context.path.removeLast();
  }
}

class AnimationChannel extends GltfProperty {
  final int _samplerIndex;
  final AnimationChannelTarget target;

  AnimationSampler _sampler;

  AnimationChannel._(this._samplerIndex, this.target,
      Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  AnimationSampler get sampler => _sampler;

  static AnimationChannel fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, ANIMATION_CHANNEL_MEMBERS, context);
    }

    return new AnimationChannel._(
        getIndex(map, SAMPLER, context),
        getObjectFromInnerMap<AnimationChannelTarget>(
            map, TARGET, context, AnimationChannelTarget.fromMap,
            req: true),
        getExtensions(map, AnimationChannel, context),
        getExtras(map));
  }

  @override
  String toString([_]) =>
      super.toString({SAMPLER: _samplerIndex, TARGET: target});
}

class AnimationChannelTarget extends GltfProperty {
  final int _nodeIndex;
  final String path;

  Node _node;

  AnimationChannelTarget._(
      this._nodeIndex, this.path, Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  Node get node => _node;

  static AnimationChannelTarget fromMap(
      Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, ANIMATION_CHANNEL_TARGET_MEMBERS, context);
    }

    return new AnimationChannelTarget._(
        getIndex(map, NODE, context, req: false),
        getString(map, PATH, context,
            req: true, list: ANIMATION_CHANNEL_TARGET_PATHS),
        getExtensions(map, AnimationChannelTarget, context),
        getExtras(map));
  }

  @override
  String toString([_]) => super.toString({NODE: _nodeIndex, PATH: path});

  @override
  int get hashCode => hash2(_nodeIndex.hashCode, path.hashCode);

  @override
  bool operator ==(Object o) =>
      o is AnimationChannelTarget &&
      _nodeIndex == o._nodeIndex &&
      path == o.path;
}

class AnimationSampler extends GltfProperty {
  final int _inputIndex;
  final String interpolation;
  final int _outputIndex;

  Accessor _input;
  Accessor _output;

  AnimationSampler._(this._inputIndex, this.interpolation, this._outputIndex,
      Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  Accessor get input => _input;
  Accessor get output => _output;

  static AnimationSampler fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, ANIMATION_SAMPLER_MEMBERS, context);
    }

    return new AnimationSampler._(
        getIndex(map, INPUT, context),
        getString(map, INTERPOLATION, context,
            list: ANIMATION_SAMPLER_INTERPOLATIONS, def: LINEAR),
        getIndex(map, OUTPUT, context),
        getExtensions(map, AnimationSampler, context),
        getExtras(map));
  }

  @override
  String toString([_]) => super.toString(
      {INPUT: _inputIndex, INTERPOLATION: interpolation, OUTPUT: _outputIndex});
}
