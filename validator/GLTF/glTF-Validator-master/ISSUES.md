# glTF 1.0.1 Validation Issues
## Errors
| No | Name | Message |
|:-:|------------|-------------|
| 1. | INVALID_JSON | Invalid JSON data. Parser output: %1 |
| 2. | INVALID_JSON_ROOT_OBJECT | JSON root must be an object. |
| 3. | ARRAY_LENGTH_NOT_IN_LIST | Wrong array length `%1`. Valid lengths are: `%2`. |
| 4. | ARRAY_LENGTH_OUT_OF_RANGE | Array length `%1` out of range |
| 5. | ARRAY_TYPE_MISMATCH | Type mismatch. Array member `%1` isn't a `%2` |
| 6. | EMPTY_ID | ID can't be an empty string. |
| 7. | INVALID_ACCESSOR_TYPE | Accessor of type `%1` expected. Got `%2`. |
| 8. | INVALID_ACCESSOR_COMPONENT_TYPE | Accessor of componentType `%1` expected. Got `%2`. |
| 9. | INVALID_GL_VALUE | Invalid value `%1` for GL type `%2`. |
| 10. | INVALID_URI | Invalid URI `%1`. Parser output: %2 |
| 11. | INVALID_DATA_URI | Invalid Data URI. Parser output: %1 |
| 12. | INVALID_DATA_URI_MIME | Invalid MIME type `%1`. |
| 13. | TYPE_MISMATCH | Type mismatch. Property value `%1` isn't a `%2`. |
| 14. | PATTERN_MISMATCH | Value `%1` doesn't match regexp pattern `%2`. |
| 15. | VALUE_NOT_IN_LIST | Wrong value `%1`. Valid values are `%2`. |
| 16. | VALUE_OUT_OF_RANGE | Value `%1` out of range. |
| 17. | UNDECLARED_EXTENSION | Extension wasn't declared in `extensionsUsed`. |
| 18. | UNDEFINED_PROPERTY | Property must be defined. |
| 19. | UNEXPECTED_EXTENSION | Extension unexpected. |
| 20. | UNRESOLVED_REFERENCE | Unresolved reference: `%1`. |
| 21. | ROOT_DICTIONARY_EMPTY | Dictionary mustn't be empty. |
| 22. | ACCESSOR_INVALID_ELEMENT_ARRAY_TYPE | Invalid value `%1` for bufferView with ELEMENT_ARRAY_BUFFER target. |
| 23. | ACCESSOR_MULTIPLE_COMPONENT_TYPE | Value `%1` isn't a multiple of componentType length `%2`. |
| 24. | ACCESSOR_TOTAL_MULTIPLE_COMPONENT_TYPE | Accessor's total byteOffset `%1` isn't a multiple of a componentType length `%2`. |
| 25. | ACCESSOR_SMALL_BYTESTRIDE | Value `%1` is less than an attribute length `%2`. |
| 26. | ACCESSOR_TOO_LONG | Value `%1` exceeds referenced bufferView (`%2`) length `%3`. |
| 27. | ACCESSOR_UINT_NO_EXT | 5125 (UNSIGNED_INT) is only allowed when the `OES_element_index_uint` GL extension used. |
| 28. | ACCESSOR_UINT_NO_ELEMENT_ARRAY | 5125 (UNSIGNED_INT) is only allowed when the accessor references bufferView with ELEMENT_ARRAY_BUFFER target. |
| 29. | ACCESSOR_UINT_NO_SCALAR | 5125 (UNSIGNED_INT) is only allowed when the type is SCALAR. |
| 30. | ANIMATION_SAMPLER_INVALID_INPUT | Invalid animation sampler (`%1`) input accessor (`%2`). |
| 31. | ANIMATION_SAMPLER_INVALID_OUTPUT | Invalid animation sampler (`%1`) output accessor (`%2`). |
| 32. | ANIMATION_DUPLICATE_TARGETS | Animation channel has the same target as channel `%1`. |
| 33. | BUFFER_VIEW_TOO_LONG | BufferView doesn't fit buffer (`%1`) byteLength (`%2`). |
| 34. | CAMERA_ZFAR_LEQUAL_ZNEAR | `zfar` must be greater than `znear`. |
| 35. | MATERIAL_NO_ATTRIBUTES | Material can't refer attribute parameters. |
| 36. | MESH_DEFAULT_NO_POSITION | No POSITION attribute found. |
| 37. | MESH_INVALID_ACCESSOR_BUFFER_VIEW | Incompatible accessor referenced: bufferView is undefined or has wrong `target`. |
| 38. | MESH_INVALID_ACCESSOR_TYPE | Incompatible accessor referenced: wrong `type` and/or `componentType`. |
| 39. | MESH_UINT_ATTRIBUTE_ACCESSOR | 5125 (UNSIGNED_INT) accessors aren't allowed for attributes. |
| 40. | MESH_UNEQUAL_ACCESSOR_COUNT | All accessors of the same primitive must have the same `count`. |
| 41. | NODE_PARENT_OVERRIDE | Value overrides parent of `%1` node. |
| 42. | NODE_LOOP | Node is a part of a node loop. |
| 43. | TEXTURE_FORMAT_INTERNALFORMAT | When defined, `format` must match `internalformat`. |
| 44. | TEXTURE_FORMAT_TYPE | Invalid combination of `type` and `format`. |
| 45. | SKIN_INVALID_ACCESSOR_COUNT | Incompatible accessor used. Expected count: `%1`, got: `%2`. |
| 46. | SCENE_NON_ROOT_NODE | Node `%1` is not a root node. |
| 47. | TECHNIQUE_AMBIGUOUS_PARAMETER | Parameter can't be uniform and attribute at the same time. |
| 48. | TECHNIQUE_ATTRIBUTE_COUNT | Attribute parameter can't have `count` property. |
| 49. | TECHNIQUE_ATTRIBUTE_NODE | Attribute parameter can't have `node` property. |
| 50. | TECHNIQUE_ATTRIBUTE_VALUE | Attribute parameter can't have `value` property. |
| 51. | TECHNIQUE_ATTRIBUTE_INVALID_TYPE | Invalid type `%1` for attribute parameter. |
| 52. | TECHNIQUE_ATTRIBUTE_TYPE_OVERRIDE | Invalid type override for semantic `%1`. |
| 53. | TECHNIQUE_INVALID_SEMANTIC | Invalid `semantic` value (`%1`). |
| 54. | TECHNIQUE_UNIFORM_NODE_TYPE | When `node` is defined, `type` must be FLOAT_MAT4. |
| 55. | TECHNIQUE_UNIFORM_SEMANTIC_TYPE | Unexpected type `%1` for semantic `%2`. |
| 56. | TECHNIQUE_UNIFORM_SEMANTIC_COUNT | Semantic `%1` can't have `count` property. |
| 57. | TECHNIQUE_UNIFORM_SEMANTIC_NO_COUNT | Semantic `%1` must have `count` property. |
| 58. | TECHNIQUE_UNUSED_PARAMETER | Unused parameter. |
| 59. | TECHNIQUE_DEPTHRANGE_VALUES | `zNear` must be less than or equal to `zFar`. |

## Warnings
| No | Name | Message |
|:-:|------------|-------------|
| 1. | BUFFER_EMBEDDED_BYTELENGTH_MISMATCH | Value `%1` is not equal to the embedded data length `%2`. |
| 2. | DUPLICATE_ELEMENTS | Array contains duplicate elements. |
| 3. | MATERIALS_VALUES_WITHOUT_TECHNIQUE | When technique is undefined, values must be undefined too. |
| 4. | NORMALIZED_FLOAT | Only non-float attributes can be normalized. |
| 5. | NORMALIZED_NON_ARRAY_BUFFER | Only vertex array buffer data can be normalized. |
| 6. | ANIMATION_ACCESSOR_WRONG_BUFFER_VIEW_TARGET | `bufferView.target` must be undefined for an animation accessor `%1`. |
| 7. | SKIN_ACCESSOR_WRONG_BUFFER_VIEW_TARGET | `bufferView.target` must be undefined for an IBM skin accessor `%1`. |
| 8. | UNEXPECTED_ATTRIBUTE | Unexpected attribute `%1` for `%2` technique or extension. |
| 9. | UNEXPECTED_PROPERTY | Unexpected property. |
| 10. | UNSUPPORTED_EXTENSION | Unsupported extension `%1`. |
| 11. | UNUSED_EXTENSION_REQUIRED | Unused extension `%1` can't be required. |
