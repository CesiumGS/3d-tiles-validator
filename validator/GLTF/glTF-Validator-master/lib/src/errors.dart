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

library gltf.error;

typedef String ErrorFunction(List args);

enum Area { IO, Schema, Semantic, Link, Data }

enum Severity { Error, Warning }

abstract class IssueType {
  final Area area;
  final Severity severity;
  final String code;
  final ErrorFunction message;

  IssueType(this.area, this.code, this.message, this.severity);
}

class DataError extends IssueType {
  static final DataError bufferEmbeddedBytelengthMismatch = new DataError._(
      'BUFFER_EMBEDDED_BYTELENGTH_MISMATCH',
      (args) => 'Actual data length `${args[0]}` is not equal to '
          'the declared buffer byteLength `${args[1]}`.');

  static final DataError bufferExternalBytelengthMismatch = new DataError._(
      'BUFFER_EXTERNAL_BYTELENGTH_MISMATCH',
      (args) => 'Actual data length `${args[0]}` is less than '
          'the declared buffer byteLength `${args[1]}`.');

  static final DataError accessorMinMismatch = new DataError._(
      'ACCESSOR_MIN_MISMATCH',
      (args) => 'Accessor element `${args[0]}` at index `${args[1]}` '
          'is less than declared minimum value `${args[2]}`.');

  static final DataError accessorMaxMismatch = new DataError._(
      'ACCESSOR_MAX_MISMATCH',
      (args) => 'Accessor element `${args[0]}` at index `${args[1]}` '
          'is greater than declared maximum value `${args[2]}`.');

  static final DataError accessorNonUnit = new DataError._(
      'ACCESSOR_NON_UNIT',
      (args) => 'Accessor element at index `${args[0]}` '
          'is not of unit length: `${args[1]}`.');

  static final DataError accessorInvalidSign = new DataError._(
      'ACCESSOR_INVALID_SIGN',
      (args) => 'Accessor element at index `${args[0]}` '
          'has not a proper sign value in `w` component: `${args[1]}`.');

  static final DataError accessorInvalidFloat = new DataError._(
      'ACCESSOR_INVALID_FLOAT',
      (args) => 'Accessor element at index `${args[0]}` '
          'is NaN or Infinity.');

  static final DataError accessorIndexOob = new DataError._(
      'ACCESSOR_INDEX_OOB',
      (args) => 'Indices accessor element at index `${args[0]}` '
          'has vertex index `${args[1]}` that exceeds number of '
          'available vertices `${args[2]}`.');

  static final DataError accessorAnimationInputNegative = new DataError._(
      'ACCESSOR_ANIMATION_INPUT_NEGATIVE',
      (args) => 'Animation input accessor element at index `${args[0]}` '
          'is negative: `${args[1]}`.');

  static final DataError accessorAnimationInputNonIncreasing = new DataError._(
      'ACCESSOR_ANIMATION_INPUT_NON_INCREASING',
      (args) => 'Animation input accessor element at index `${args[0]}` '
          'is less than or equals to previous: `${args[1]} <= ${args[2]}`.');

  static final DataError accessorSparseIndicesNonIncreasing = new DataError._(
      'ACCESSOR_SPARSE_INDICES_NON_INCREASING',
      (args) => 'Accessor sparse indices element at index `${args[0]}` '
          'is less than or equals to previous: `${args[1]} <= ${args[2]}`.');

  static final DataError accessorSparseIndexOob = new DataError._(
      'ACCESSOR_SPARSE_INDEX_OOB',
      (args) =>
          'Accessor sparse indices element at index `${args[0]}` is greater '
          'than the number of accessor elements: `${args[1]} <= ${args[2]}`.');

  static final DataError indecomposableMatrix = new DataError._(
      'ACCESSOR_INDECOMPOSABLE_MATRIX',
      (args) => 'Matrix element at index '
          '`${args[0]}` is not decomposable to TRS.');

  static final DataError imageDataInvalid = new DataError._(
      'IMAGE_DATA_INVALID',
      (args) => 'Image data is invalid. ${args[0]}');

  static final DataError imageMimeTypeInvalid = new DataError._(
      'IMAGE_MIME_TYPE_INVALID',
      (args) => 'Recognized image format (`${args[0]}`) does not match '
          'declared image format (`${args[1]}`).');

  static final DataError imageUnexpectedEos = new DataError._(
      'IMAGE_UNEXPECTED_EOS', (args) => 'Unexpected end of image stream.');

  static final DataError imageUnrecognizedFormat = new DataError._(
      'IMAGE_UNRECOGNIZED_FORMAT',
      (args) => 'Image format has not been recognized.');

  static final DataError imageNonPowerOfTwoDimensions = new DataError._(
      'IMAGE_NPOT_DIMENSIONS',
      (args) => 'Image has non-power-of-two dimensions: ${args[0]}x${args[1]}.',
      Severity.Warning);

  DataError._(String type, ErrorFunction message,
      [Severity severity = Severity.Error])
      : super(Area.Data, type, message, severity);
}

class IoError extends IssueType {
  static final IoError fileNotFound =
      new IoError._('FILE_NOT_FOUND', (args) => 'File not found. ${args[0]}');

  IoError._(String type, ErrorFunction message,
      [Severity severity = Severity.Error])
      : super(Area.IO, type, message, severity);
}

class SchemaError extends IssueType {
  static final SchemaError arrayLengthNotInList = new SchemaError._(
      'ARRAY_LENGTH_NOT_IN_LIST',
      (args) => 'Invalid array length `${args[0]}`. '
          'Valid lengths are: `${args[1]}`.');

  static final SchemaError arrayTypeMismatch = new SchemaError._(
      'ARRAY_TYPE_MISMATCH',
      (args) =>
          'Type mismatch. Array element `${args[0]}` is not a `${args[1]}`.');

  static final SchemaError arrayDuplicateElements = new SchemaError._(
      'DUPLICATE_ELEMENTS', (args) => 'Duplicate element at ${args[0]}.');

  static final SchemaError invalidIndex = new SchemaError._(
      'INVALID_INDEX', (_) => 'Index must be a non-negative integer.');

  static final SchemaError invalidJson = new SchemaError._(
      'INVALID_JSON', (args) => 'Invalid JSON data. Parser output: ${args[0]}');

  static final SchemaError invalidUri = new SchemaError._('INVALID_URI',
      (args) => 'Invalid URI `${args[0]}`. Parser output: ${args[1]}');

  static final SchemaError emptyEntity =
      new SchemaError._('EMPTY_ENTITY', (args) => 'Entity can not be empty.');

  static final SchemaError oneOfMismatch = new SchemaError._('ONE_OF_MISMATCH',
      (args) => 'Exactly one of `$args` properties must be defined.');

  static final SchemaError patternMismatch = new SchemaError._(
      'PATTERN_MISMATCH',
      (args) =>
          'Value `${args[0]}` does not match regexp pattern `${args[1]}`.');

  static final SchemaError typeMismatch = new SchemaError._(
      'TYPE_MISMATCH',
      (args) =>
          'Type mismatch. Property value `${args[0]}` is not a `${args[1]}`.');

  static final SchemaError valueNotInList = new SchemaError._(
      'VALUE_NOT_IN_LIST',
      (args) => 'Invalid value `${args[0]}`. Valid values are `${args[1]}`.');

  static final SchemaError valueNotInRange = new SchemaError._(
      'VALUE_NOT_IN_RANGE', (args) => 'Value `${args[0]}` is out of range.');

  static final SchemaError valueMultipleOf = new SchemaError._(
      'VALUE_MULTIPLE_OF',
      (args) => 'Value `${args[0]}` is not a multiple of `${args[1]}`.');

  static final SchemaError undefinedProperty = new SchemaError._(
      'UNDEFINED_PROPERTY', (args) => 'Property must be defined.');

  static final SchemaError unexpectedProperty = new SchemaError._(
      'UNEXPECTED_PROPERTY',
      (args) => 'Unexpected property.',
      Severity.Warning);

  static final SchemaError unsatisfiedDependency = new SchemaError._(
      'UNSATISFIED_DEPENDENCY',
      (args) => 'Dependency failed. `${args[0]}` must be defined.');

  SchemaError._(String type, ErrorFunction message,
      [Severity severity = Severity.Error])
      : super(Area.Schema, type, message, severity);
}

class SemanticError extends IssueType {
  static final SemanticError unknownAssetMajorVersion = new SemanticError._(
      'UNKNOWN_ASSET_MAJOR_VERSION',
      (args) => 'Unknown glTF major asset version: `${args[0]}`.');

  static final SemanticError unknownAssetMinorVersion = new SemanticError._(
      'UNKNOWN_ASSET_MINOR_VERSION',
      (args) => 'Unknown glTF minor asset version: `${args[0]}`.',
      Severity.Warning);

  static final SemanticError minVersionGreaterThanVersion = new SemanticError._(
      'ASSET_MIN_VERSION_GREATER_THAN_VERSION',
      (args) => 'Asset minVersion (`${args[0]}`) is greater '
          'then version (`${args[1]}`).',
      Severity.Warning);

  static final SemanticError invalidGlValue = new SemanticError._(
      'INVALID_GL_VALUE',
      (args) => 'Invalid value `${args[0]}` for GL type `${args[1]}`.');

  static final SemanticError integerWrittenAsFloat = new SemanticError._(
      'INTEGER_WRITEN_AS_FLOAT',
      (args) => 'Integer value is written with fractional part: `${args[0]}`.');

  static final SemanticError accessorNormalizedInvalid = new SemanticError._(
      'ACCESSOR_NORMALIZED_INVALID',
      (args) => 'Only (u)byte and (u)short accessors can be normalized.');

  static final SemanticError accessorOffsetAlignment = new SemanticError._(
      'ACCESSOR_OFFSET_ALIGNMENT',
      (args) => 'Offset `${args[0]}` is not a multiple of '
          'componentType length `${args[1]}`.');

  static final SemanticError accessorMatrixAlignment = new SemanticError._(
      'ACCESSOR_MATRIX_ALIGNMENT',
      (args) => 'Matrix accessors must be aligned to 4-byte boundaries.');

  static final SemanticError accessorSparseCountOutOfRange =
      new SemanticError._(
          'ACCESSOR_SPARSE_COUNT_OUT_OF_RANGE',
          (args) => 'Sparse accessor overrides more elements (`${args[0]}`) '
              'than the base accessor contains (`${args[1]}`).');

  static final SemanticError bufferDataUriMimeTypeInvalid = new SemanticError._(
      'BUFFER_DATA_URI_MIME_TYPE_INVALID',
      (args) =>
          "Buffer's Data URI MIME-Type must be `application/octet-stream`. "
          "Got `${args[0]}` instead.");

  static final SemanticError bufferViewTooBigByteStride = new SemanticError._(
      'BUFFER_VIEW_TOO_BIG_BYTE_STRIDE',
      (args) => "Buffer view's byteStride (`${args[0]}`) is "
          "smaller than byteLength (`${args[1]}`).");

  static final SemanticError bufferViewInvalidByteStride = new SemanticError._(
      'BUFFER_VIEW_INVALID_BYTE_STRIDE',
      (args) => 'Only buffer views with raw vertex data can have byteStride.');

  static final SemanticError cameraXmagYmagZero = new SemanticError._(
      'CAMERA_XMAG_YMAG_ZERO',
      (args) => '`xmag` and `ymag` must not be zero.',
      Severity.Warning);

  static final SemanticError cameraZfarLequalZnear = new SemanticError._(
      'CAMERA_ZFAR_LEQUAL_ZNEAR',
      (args) => '`zfar` must be greater than `znear`.');

  static final SemanticError meshPrimitiveInvalidAttribute =
      new SemanticError._('MESH_PRIMITIVE_INVALID_ATTRIBUTE',
          (args) => 'Invalid attribute name `${args[0]}`.');

  static final SemanticError meshPrimitivesUnequalTargetsCount =
      new SemanticError._(
          'MESH_PRIMITIVES_UNEQUAL_TARGETS_COUNT',
          (args) =>
              'All primitives must have the same number of morph targets.');

  static final SemanticError meshPrimitiveNoPosition = new SemanticError._(
      'MESH_PRIMITIVE_NO_POSITION', (args) => 'No POSITION attribute found.');

  static final SemanticError meshPrimitiveTangentWithoutNormal =
      new SemanticError._(
          'MESH_PRIMITIVE_TANGENT_WITHOUT_NORMAL',
          (args) => 'TANGENT attribute without NORMAL found.',
          Severity.Warning);

  static final SemanticError meshPrimitiveJointsWeightsMismatch =
      new SemanticError._(
          'MESH_PRIMITIVE_JOINTS_WEIGHTS_MISMATCH',
          (args) => 'Number of JOINTS attribute semantics '
              'must match number of WEIGHTS.');

  static final SemanticError meshPrimitiveTangentPoints = new SemanticError._(
      'MESH_PRIMITIVE_TANGENT_POINTS',
      (args) => 'TANGENT attribute defined for POINTS rendering mode.',
      Severity.Warning);

  static final SemanticError meshInvalidWeightsCount = new SemanticError._(
      'MESH_INVALID_WEIGHTS_COUNT',
      (args) => 'The length of `weights` array (`${args[0]}`) does not match '
          'the number of morph targets (`${args[1]}`).');

  static final SemanticError nodeMatrixTrs = new SemanticError._(
      'NODE_MATRIX_TRS',
      (args) => 'A node can have either a `matrix` or any combination of '
          '`translation`/`rotation`/`scale` (TRS) properties.');

  static final SemanticError nodeDefaultMatrix = new SemanticError._(
      'NODE_MATRIX_DEFAULT',
      (args) => 'Do not specify default transform matrix.',
      Severity.Warning);

  static final SemanticError nodeNonTrsMatrix = new SemanticError._(
      'NODE_MATRIX_NON_TRS', (args) => 'Matrix must be decomposable to TRS.');

  static final SemanticError nodeRotationNonUnit = new SemanticError._(
      'NODE_ROTATION_NON_UNIT', (args) => 'Rotation quaternion must be unit.');

  static final SemanticError unusedExtensionRequired = new SemanticError._(
      'UNUSED_EXTENSION_REQUIRED',
      (args) => 'Unused extension `${args[0]}` can not be required.');

  static final SemanticError nodeEmpty = new SemanticError._(
      'NODE_EMPTY', (args) => 'Empty node encountered.', Severity.Warning);

  static final SemanticError nonRelativeUri = new SemanticError._(
      'NON_RELATIVE_URI',
      (args) => 'Non-relative URI found: `${args[0]}`.',
      Severity.Warning);

  SemanticError._(String type, ErrorFunction message,
      [Severity severity = Severity.Error])
      : super(Area.Semantic, type, message, severity);
}

class LinkError extends IssueType {
  static final LinkError accessorTotalOffsetAlignment = new LinkError._(
      'ACCESSOR_TOTAL_OFFSET_ALIGNMENT',
      (args) => "Accessor's total byteOffset `${args[0]}` isn't a multiple of "
          "componentType length `${args[1]}`.");

  static final LinkError accessorSmallStride = new LinkError._(
      'ACCESSOR_SMALL_BYTESTRIDE',
      (args) =>
          "Referenced bufferView's byteStride value `${args[0]}` is less than "
          "accessor element's length `${args[1]}`.");

  static final LinkError accessorTooLong = new LinkError._(
      'ACCESSOR_TOO_LONG',
      (args) =>
          'Accessor (offset: `${args[0]}`, length: `${args[1]}`) does not fit '
          'referenced bufferView [`${args[2]}`] length `${args[3]}`.');

  static final LinkError accessorUsageOverride = new LinkError._(
      'ACCESSOR_USAGE_OVERRIDE',
      (args) => 'Override of previously set accessor usage. '
          'Initial: `${args[0]}`, new: `${args[1]}`.');

  static final LinkError animationDuplicateTargets = new LinkError._(
      'ANIMATION_DUPLICATE_TARGETS',
      (args) =>
          'Animation channel has the same target as channel `${args[0]}`.');

  static final LinkError animationChannelTargetNodeMatrix = new LinkError._(
      'ANIMATION_CHANNEL_TARGET_NODE_MATRIX',
      (args) => 'Animation channel can not target TRS properties '
          'of node with defined `matrix`.');

  static final LinkError animationChannelTargetNodeWeightsNoMorphs =
      new LinkError._(
          'ANIMATION_CHANNEL_TARGET_NODE_WEIGHTS_NO_MORPHS',
          (args) => 'Animation channel can not target WEIGHTS when mesh '
              'does not have morph targets.');

  static final LinkError animationSamplerInputAccessorWithoutBounds =
      new LinkError._(
          'ANIMATION_SAMPLER_INPUT_ACCESSOR_WITHOUT_BOUNDS',
          (args) => '`accessor.min` and `accessor.max` must be defined for '
              'animation input accessor.');

  static final LinkError animationSamplerInputAccessorInvalidFormat =
      new LinkError._(
          'ANIMATION_SAMPLER_INPUT_ACCESSOR_INVALID_FORMAT',
          (args) => 'Animation sampler input accessor must be '
              'one of `${args[0]}`. Got `${args[1]}`');

  static final LinkError animationSamplerOutputAccessorInvalidFormat =
      new LinkError._(
          'ANIMATION_SAMPLER_OUTPUT_ACCESSOR_INVALID_FORMAT',
          (args) => 'Animation sampler output accessor format '
              'for path `${args[0]}` must be one of `${args[1]}`. '
              'Got `${args[2]}`.');

  static final LinkError animationSamplerOutputAccessorInvalidCount =
      new LinkError._(
          'ANIMATION_SAMPLER_OUTPUT_ACCESSOR_INVALID_COUNT',
          (args) => 'Animation sampler output accessor of count '
              '`${args[0]}` expected. Got `${args[1]}`.');

  static final LinkError bufferViewTooLong = new LinkError._(
      'BUFFER_VIEW_TOO_LONG',
      (args) => 'BufferView does not fit buffer '
          '(`${args[0]}`) byteLength (`${args[1]}`).');

  static final LinkError bufferViewTargetOverride = new LinkError._(
      'BUFFER_VIEW_TARGET_OVERRIDE',
      (args) => 'Override of previously set bufferView target or usage. '
          'Initial: `${args[0]}`, new: `${args[1]}`.');

  static final LinkError invalidIbmAccessorCount = new LinkError._(
      'INVALID_IBM_ACCESSOR_COUNT',
      (args) => 'Accessor of count `${args[0]}` expected. Got `${args[1]}`.');

  static final LinkError meshPrimitiveAttributesAccessorInvalidFormat =
      new LinkError._(
          'MESH_PRIMITIVE_ATTRIBUTES_ACCESSOR_INVALID_FORMAT',
          (args) => 'Invalid accessor referenced for this attribute semantic. '
              'Valid accessor types are `${args[0]}`, got `${args[1]}`.');

  static final LinkError meshPrimitivePositionAccessorWithoutBounds =
      new LinkError._(
          'MESH_PRIMITIVE_POSITION_ACCESSOR_WITHOUT_BOUNDS',
          (args) => '`accessor.min` and `accessor.max` must be defined for '
              'POSITION attribute accessor.');

  static final LinkError meshPrimitiveAccessorWithoutByteStride =
      new LinkError._(
          'MESH_PRIMITIVE_ACCESSOR_WITHOUT_BYTESTRIDE',
          (args) => '`bufferView.byteStride` must be defined when '
              'two or more accessors use the same buffer view.');

  static final LinkError meshPrimitiveAccessorUnaligned = new LinkError._(
      'MESH_PRIMITIVE_ACCESSOR_UNALIGNED',
      (args) => 'Vertex attribute data must be aligned to 4-byte boundaries.');

  static final LinkError meshPrimitiveIndicesAccessorWithByteStride =
      new LinkError._(
          'MESH_PRIMITIVE_INDICES_ACCESSOR_WITH_BYTESTRIDE',
          (args) => '`bufferView.byteStride` must not be defined '
              'for indices accessor.');

  static final LinkError meshPrimitiveIndicesAccessorInvalidFormat =
      new LinkError._(
          'MESH_PRIMITIVE_INDICES_ACCESSOR_INVALID_FORMAT',
          (args) => 'Indices accessor format must be one of `${args[0]}`. '
              'Got `${args[1]}`.');

  static final LinkError meshPrimitiveIncompatibleMode = new LinkError._(
      'MESH_PRIMITIVE_INCOMPATIBLE_MODE',
      (args) => 'Number of vertices or indices (`${args[0]}`) '
          'is not compatible with used drawing mode (`${args[0]}`).',
      Severity.Warning);

  static final LinkError meshPrimitiveUnequalAccessorsCount = new LinkError._(
      'MESH_PRIMITIVE_UNEQUAL_ACCESSOR_COUNT',
      (args) =>
          'All accessors of the same primitive must have the same `count`.');

  static final LinkError meshPrimitiveMorphTargetNoBaseAccessor =
      new LinkError._('MESH_PRIMITIVE_MORPH_TARGET_NO_BASE_ACCESSOR',
          (args) => 'No base accessor for this attribute semantic.');

  static final LinkError meshPrimitiveMorphTargetInvalidAttributeCount =
      new LinkError._('MESH_PRIMITIVE_MORPH_TARGET_INVALID_ATTRIBUTE_COUNT',
          (args) => 'Base accessor has different `count`.');

  static final LinkError nodeLoop =
      new LinkError._('NODE_LOOP', (args) => 'Node is a part of a node loop.');

  static final LinkError nodeParentOverride = new LinkError._(
      'NODE_PARENT_OVERRIDE',
      (args) => 'Value overrides parent of node `${args[0]}`.');

  static final LinkError nodeWeightsInvalid = new LinkError._(
      'NODE_WEIGHTS_INVALID',
      (args) => 'The length of `weights` array (`${args[0]}`) does not match '
          'the number of morph targets (`${args[1] ?? 0}`).');

  static final LinkError nodeSkinWithNonSkinnedMesh = new LinkError._(
      'NODE_WITH_NON_SKINNED_MESH',
      (args) => 'Node has `skin` defined, but `mesh` has no joints data.');

  static final LinkError sceneNonRootNode = new LinkError._(
      'SCENE_NON_ROOT_NODE', (args) => 'Node `${args[0]}` is not a root node.');

  static final LinkError skinIbmInvalidFormat = new LinkError._(
      'SKIN_IBM_INVALID_FORMAT',
      (args) => 'IBM accessor format must be one of `${args[0]}`. '
          'Got `${args[1]}`.');

  static final LinkError undeclaredExtension = new LinkError._(
      'UNDECLARED_EXTENSION',
      (args) => 'Extension was not declared in `extensionsUsed`.');

  static final LinkError unexpectedExtensionObject = new LinkError._(
      'UNEXPECTED_EXTENSION_OBJECT',
      (args) => 'Unexpected extension object for this extension.');

  static final LinkError unresolvedReference = new LinkError._(
      'UNRESOLVED_REFERENCE', (args) => 'Unresolved reference: `${args[0]}`.');

  static final LinkError unsupportedExtension = new LinkError._(
      'UNSUPPORTED_EXTENSION',
      (args) => 'Unsupported extension encountered: `${args[0]}`.',
      Severity.Warning);

  LinkError._(String type, ErrorFunction message,
      [Severity severity = Severity.Error])
      : super(Area.Link, type, message, severity);
}

class GlbError extends IssueType {
  static final GlbError invalidMagic = new GlbError._(
      'GLB_INVALID_MAGIC', (args) => 'Invalid GLB magic value (`${args[0]}`).');

  static final GlbError invalidVersion = new GlbError._('GLB_INVALID_VERSION',
      (args) => 'Invalid GLB version value (`${args[0]}`).');

  static final GlbError lengthTooSmall = new GlbError._('GLB_LENGTH_TOO_SMALL',
      (args) => 'Declared GLB length (`${args[0]}`) is too small.');

  static final GlbError chunkLengthUnaligned = new GlbError._(
      'GLB_CHUNK_LENGTH_UNALIGNED',
      (args) =>
          'Length of `${args[0]}` chunk is not aligned to 4-byte boundaries.');

  static final GlbError lengthMismatch = new GlbError._(
      'GLB_LENGTH_MISMATCH',
      (args) => 'Declared length (`${args[0]}`) does not match '
          'GLB length (`${args[1]}`).');

  static final GlbError chunkTooBig = new GlbError._(
      'GLB_CHUNK_TOO_BIG',
      (args) => 'Chunk (`${args[0]}`) length (`${args[1]}`) does not fit '
          'total GLB length.');

  static final GlbError emptyChunk = new GlbError._('GLB_EMPTY_CHUNK',
      (args) => 'Chunk (`${args[0]}`) can not have zero length.');

  static final GlbError duplicateChunk = new GlbError._('GLB_DUPLICATE_CHUNK',
      (args) => 'Chunk of type `${args[0]}` has already been seen.');

  static final GlbError unexpectedEndOfChunkHeader = new GlbError._(
      'GLB_UNEXPECTED_END_OF_CHUNK_HEADER',
      (args) => 'Unexpected end of chunk header.');

  static final GlbError unexpectedEndOfChunkData = new GlbError._(
      'GLB_UNEXPECTED_END_OF_CHUNK_DATA',
      (args) => 'Unexpected end of chunk data.');

  static final GlbError unexpectedEndOfHeader = new GlbError._(
      'GLB_UNEXPECTED_END_OF_HEADER', (args) => 'Unexpected end of header.');

  static final GlbError unexpectedFirstChunk = new GlbError._(
      'GLB_UNEXPECTED_FIRST_CHUNK',
      (args) => 'First chunk must be of JSON type. Got `${args[0]}` instead.');

  static final GlbError unknownChunkType = new GlbError._(
      'GLB_UNKNOWN_CHUNK_TYPE',
      (args) => 'Unknown GLB chunk type: `${args[0]}`.',
      Severity.Warning);

  GlbError._(String type, ErrorFunction message,
      [Severity severity = Severity.Error])
      : super(Area.Schema, type, message, severity);
}

class Issue {
  final IssueType type;
  final String path;
  final List _args;

  Issue(this.type, this.path, this._args);

  String get message => type.message(_args);

  @override
  int get hashCode => toString().hashCode;

  @override
  bool operator ==(Object o) => o is Issue && o.toString() == toString();

  Map<String, String> toMap() {
    final map = <String, String>{};
    map['type'] = type.code;
    if (path != null) {
      map['path'] = path;
    }
    if (message != null) {
      map['message'] = message;
    }
    return map;
  }

  @override
  String toString() => path.isNotEmpty ? '$path: $message' : message;
}
