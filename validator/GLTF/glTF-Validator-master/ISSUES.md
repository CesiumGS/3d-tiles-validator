# glTF 2.0 Validation Issues
## IoError
| No | Name | Message |
|:---:|------------|-------------|
|1|FILE_NOT_FOUND|File not found. %1|
## SchemaError
| No | Name | Message |
|:---:|------------|-------------|
|1|ARRAY_LENGTH_NOT_IN_LIST|Invalid array length `%1`. Valid lengths are: `%2`.|
|2|ARRAY_TYPE_MISMATCH|Type mismatch. Array element `%1` is not a `%2`.|
|3|DUPLICATE_ELEMENTS|Duplicate element at %1.|
|4|INVALID_INDEX|Index must be a non-negative integer.|
|5|INVALID_JSON|Invalid JSON data. Parser output: %1|
|6|INVALID_URI|Invalid URI `%1`. Parser output: %2|
|7|EMPTY_ENTITY|Entity can not be empty.|
|8|ONE_OF_MISMATCH|Exactly one of `[%1, %2, %3, %4]` properties must be defined.|
|9|PATTERN_MISMATCH|Value `%1` does not match regexp pattern `%2`.|
|10|TYPE_MISMATCH|Type mismatch. Property value `%1` is not a `%2`.|
|11|VALUE_NOT_IN_LIST|Invalid value `%1`. Valid values are `%2`.|
|12|VALUE_NOT_IN_RANGE|Value `%1` is out of range.|
|13|VALUE_MULTIPLE_OF|Value `%1` is not a multiple of `%2`.|
|14|UNDEFINED_PROPERTY|Property must be defined.|
|15|UNEXPECTED_PROPERTY|Unexpected property.|
|16|UNSATISFIED_DEPENDENCY|Dependency failed. `%1` must be defined.|
## SemanticError
| No | Name | Message |
|:---:|------------|-------------|
|1|UNKNOWN_ASSET_MAJOR_VERSION|Unknown glTF major asset version: `%1`.|
|2|UNKNOWN_ASSET_MINOR_VERSION|Unknown glTF minor asset version: `%1`.|
|3|ASSET_MIN_VERSION_GREATER_THAN_VERSION|Asset minVersion (`%1`) is greater then version (`%2`).|
|4|INVALID_GL_VALUE|Invalid value `%1` for GL type `%2`.|
|5|INTEGER_WRITEN_AS_FLOAT|Integer value is written with fractional part: `%1`.|
|6|ACCESSOR_NORMALIZED_INVALID|Only (u)byte and (u)short accessors can be normalized.|
|7|ACCESSOR_OFFSET_ALIGNMENT|Offset `%1` is not a multiple of componentType length `%2`.|
|8|ACCESSOR_MATRIX_ALIGNMENT|Matrix accessors must be aligned to 4-byte boundaries.|
|9|ACCESSOR_SPARSE_COUNT_OUT_OF_RANGE|Sparse accessor overrides more elements (`%1`) than the base accessor contains (`%2`).|
|10|BUFFER_DATA_URI_MIME_TYPE_INVALID|Buffer's Data URI MIME-Type must be `application/octet-stream`. Got `%1` instead.|
|11|BUFFER_VIEW_TOO_BIG_BYTE_STRIDE|Buffer view's byteStride (`%1`) is smaller than byteLength (`%2`).|
|12|BUFFER_VIEW_INVALID_BYTE_STRIDE|Only buffer views with raw vertex data can have byteStride.|
|13|CAMERA_XMAG_YMAG_ZERO|`xmag` and `ymag` must not be zero.|
|14|CAMERA_ZFAR_LEQUAL_ZNEAR|`zfar` must be greater than `znear`.|
|15|MESH_PRIMITIVE_INVALID_ATTRIBUTE|Invalid attribute name `%1`.|
|16|MESH_PRIMITIVES_UNEQUAL_TARGETS_COUNT|All primitives must have the same number of morph targets.|
|17|MESH_PRIMITIVE_NO_POSITION|No POSITION attribute found.|
|18|MESH_PRIMITIVE_TANGENT_WITHOUT_NORMAL|TANGENT attribute without NORMAL found.|
|19|MESH_PRIMITIVE_JOINTS_WEIGHTS_MISMATCH|Number of JOINTS attribute semantics must match number of WEIGHTS.|
|20|MESH_PRIMITIVE_TANGENT_POINTS|TANGENT attribute defined for POINTS rendering mode.|
|21|MESH_INVALID_WEIGHTS_COUNT|The length of `weights` array (`%1`) does not match the number of morph targets (`%2`).|
|22|NODE_MATRIX_TRS|A node can have either a `matrix` or any combination of `translation`/`rotation`/`scale` (TRS) properties.|
|23|NODE_MATRIX_DEFAULT|Do not specify default transform matrix.|
|24|NODE_MATRIX_NON_TRS|Matrix must be decomposable to TRS.|
|25|NODE_ROTATION_NON_UNIT|Rotation quaternion must be unit.|
|26|UNUSED_EXTENSION_REQUIRED|Unused extension `%1` can not be required.|
|27|NODE_EMPTY|Empty node encountered.|
|28|NON_RELATIVE_URI|Non-relative URI found: `%1`.|
## LinkError
| No | Name | Message |
|:---:|------------|-------------|
|1|ACCESSOR_TOTAL_OFFSET_ALIGNMENT|Accessor's total byteOffset `%1` isn't a multiple of componentType length `%2`.|
|2|ACCESSOR_SMALL_BYTESTRIDE|Referenced bufferView's byteStride value `%1` is less than accessor element's length `%2`.|
|3|ACCESSOR_TOO_LONG|Accessor (offset: `%1`, length: `%2`) does not fit referenced bufferView [`%3`] length `%4`.|
|4|ACCESSOR_USAGE_OVERRIDE|Override of previously set accessor usage. Initial: `%1`, new: `%2`.|
|5|ANIMATION_DUPLICATE_TARGETS|Animation channel has the same target as channel `%1`.|
|6|ANIMATION_CHANNEL_TARGET_NODE_MATRIX|Animation channel can not target TRS properties of node with defined `matrix`.|
|7|ANIMATION_CHANNEL_TARGET_NODE_WEIGHTS_NO_MORPHS|Animation channel can not target WEIGHTS when mesh does not have morph targets.|
|8|ANIMATION_SAMPLER_INPUT_ACCESSOR_WITHOUT_BOUNDS|`accessor.min` and `accessor.max` must be defined for animation input accessor.|
|9|ANIMATION_SAMPLER_INPUT_ACCESSOR_INVALID_FORMAT|Animation sampler input accessor must be one of `%1`. Got `%2`|
|10|ANIMATION_SAMPLER_OUTPUT_ACCESSOR_INVALID_FORMAT|Animation sampler output accessor format for path `%1` must be one of `%2`. Got `%3`.|
|11|ANIMATION_SAMPLER_OUTPUT_ACCESSOR_INVALID_COUNT|Animation sampler output accessor of count `%1` expected. Got `%2`.|
|12|BUFFER_VIEW_TOO_LONG|BufferView does not fit buffer (`%1`) byteLength (`%2`).|
|13|BUFFER_VIEW_TARGET_OVERRIDE|Override of previously set bufferView target or usage. Initial: `%1`, new: `%2`.|
|14|INVALID_IBM_ACCESSOR_COUNT|Accessor of count `%1` expected. Got `%2`.|
|15|MESH_PRIMITIVE_ATTRIBUTES_ACCESSOR_INVALID_FORMAT|Invalid accessor referenced for this attribute semantic. Valid accessor types are `%1`, got `%2`.|
|16|MESH_PRIMITIVE_POSITION_ACCESSOR_WITHOUT_BOUNDS|`accessor.min` and `accessor.max` must be defined for POSITION attribute accessor.|
|17|MESH_PRIMITIVE_ACCESSOR_WITHOUT_BYTESTRIDE|`bufferView.byteStride` must be defined when two or more accessors use the same buffer view.|
|18|MESH_PRIMITIVE_ACCESSOR_UNALIGNED|Vertex attribute data must be aligned to 4-byte boundaries.|
|19|MESH_PRIMITIVE_INDICES_ACCESSOR_WITH_BYTESTRIDE|`bufferView.byteStride` must not be defined for indices accessor.|
|20|MESH_PRIMITIVE_INDICES_ACCESSOR_INVALID_FORMAT|Indices accessor format must be one of `%1`. Got `%2`.|
|21|MESH_PRIMITIVE_INCOMPATIBLE_MODE|Number of vertices or indices (`%1`) is not compatible with used drawing mode (`%1`).|
|22|MESH_PRIMITIVE_UNEQUAL_ACCESSOR_COUNT|All accessors of the same primitive must have the same `count`.|
|23|MESH_PRIMITIVE_MORPH_TARGET_NO_BASE_ACCESSOR|No base accessor for this attribute semantic.|
|24|MESH_PRIMITIVE_MORPH_TARGET_INVALID_ATTRIBUTE_COUNT|Base accessor has different `count`.|
|25|NODE_LOOP|Node is a part of a node loop.|
|26|NODE_PARENT_OVERRIDE|Value overrides parent of node `%1`.|
|27|NODE_WEIGHTS_INVALID|The length of `weights` array (`%1`) does not match the number of morph targets (`%2`).|
|28|NODE_WITH_NON_SKINNED_MESH|Node has `skin` defined, but `mesh` has no joints data.|
|29|SCENE_NON_ROOT_NODE|Node `%1` is not a root node.|
|30|SKIN_IBM_INVALID_FORMAT|IBM accessor format must be one of `%1`. Got `%2`.|
|31|UNDECLARED_EXTENSION|Extension was not declared in `extensionsUsed`.|
|32|UNEXPECTED_EXTENSION_OBJECT|Unexpected extension object for this extension.|
|33|UNRESOLVED_REFERENCE|Unresolved reference: `%1`.|
|34|UNSUPPORTED_EXTENSION|Unsupported extension encountered: `%1`.|
## DataError
| No | Name | Message |
|:---:|------------|-------------|
|1|BUFFER_EMBEDDED_BYTELENGTH_MISMATCH|Actual data length `%1` is not equal to the declared buffer byteLength `%2`.|
|2|BUFFER_EXTERNAL_BYTELENGTH_MISMATCH|Actual data length `%1` is less than the declared buffer byteLength `%2`.|
|3|ACCESSOR_MIN_MISMATCH|Accessor element `%1` at index `%2` is less than declared minimum value `%3`.|
|4|ACCESSOR_MAX_MISMATCH|Accessor element `%1` at index `%2` is greater than declared maximum value `%3`.|
|5|ACCESSOR_NON_UNIT|Accessor element at index `%1` is not of unit length: `%2`.|
|6|ACCESSOR_INVALID_SIGN|Accessor element at index `%1` has not a proper sign value in `w` component: `%2`.|
|7|ACCESSOR_INVALID_FLOAT|Accessor element at index `%1` is NaN or Infinity.|
|8|ACCESSOR_INDEX_OOB|Indices accessor element at index `%1` has vertex index `%2` that exceeds number of available vertices `%3`.|
|9|ACCESSOR_ANIMATION_INPUT_NEGATIVE|Animation input accessor element at index `%1` is negative: `%2`.|
|10|ACCESSOR_ANIMATION_INPUT_NON_INCREASING|Animation input accessor element at index `%1` is less than or equals to previous: `%2 <= %3`.|
|11|ACCESSOR_SPARSE_INDICES_NON_INCREASING|Accessor sparse indices element at index `%1` is less than or equals to previous: `%2 <= %3`.|
|12|ACCESSOR_SPARSE_INDEX_OOB|Accessor sparse indices element at index `%1` is greater than the number of accessor elements: `%2 <= %3`.|
|13|ACCESSOR_INDECOMPOSABLE_MATRIX|Matrix element at index `%1` is not decomposable to TRS.|
|14|IMAGE_DATA_INVALID|Image data is invalid. %1|
|15|IMAGE_MIME_TYPE_INVALID|Recognized image format (`%1`) does not match declared image format (`%2`).|
|16|IMAGE_UNEXPECTED_EOS|Unexpected end of image stream.|
|17|IMAGE_UNRECOGNIZED_FORMAT|Image format has not been recognized.|
|18|IMAGE_NPOT_DIMENSIONS|Image has non-power-of-two dimensions: %1x%2.|
## GlbError
| No | Name | Message |
|:---:|------------|-------------|
|1|GLB_INVALID_MAGIC|Invalid GLB magic value (`%1`).|
|2|GLB_INVALID_VERSION|Invalid GLB version value (`%1`).|
|3|GLB_LENGTH_TOO_SMALL|Declared GLB length (`%1`) is too small.|
|4|GLB_CHUNK_LENGTH_UNALIGNED|Length of `%1` chunk is not aligned to 4-byte boundaries.|
|5|GLB_LENGTH_MISMATCH|Declared length (`%1`) does not match GLB length (`%2`).|
|6|GLB_CHUNK_TOO_BIG|Chunk (`%1`) length (`%2`) does not fit total GLB length.|
|7|GLB_EMPTY_CHUNK|Chunk (`%1`) can not have zero length.|
|8|GLB_DUPLICATE_CHUNK|Chunk of type `%1` has already been seen.|
|9|GLB_UNEXPECTED_END_OF_CHUNK_HEADER|Unexpected end of chunk header.|
|10|GLB_UNEXPECTED_END_OF_CHUNK_DATA|Unexpected end of chunk data.|
|11|GLB_UNEXPECTED_END_OF_HEADER|Unexpected end of header.|
|12|GLB_UNEXPECTED_FIRST_CHUNK|First chunk must be of JSON type. Got `%1` instead.|
|13|GLB_UNKNOWN_CHUNK_TYPE|Unknown GLB chunk type: `%1`.|
