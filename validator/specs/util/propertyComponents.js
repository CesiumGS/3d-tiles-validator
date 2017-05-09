var componentTypeByteLength = {
    'BYTE': 1,
    'UNSIGNED_BYTE': 1,
    'SHORT': 2,
    'UNSIGNED_SHORT': 2,
    'INT': 4,
    'UNSIGNED_INT': 4,
    'FLOAT': 4,
    'DOUBLE': 8
};

var typeToNumberOfComponents = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4
};

module.exports = {
    componentTypeByteLength: componentTypeByteLength,
    typeToNumberOfComponents: typeToNumberOfComponents
};