'use strict';

module.exports = {
    isValidWebGLDataTypeEnum: isValidWebGLDataTypeEnum,
    componentTypeStringToInteger: componentTypeToInteger,
    webglDataTypeToByteSize: webglDataTypeToByteSize,
    elementTypeToCount: elementTypeToCount
};

function isValidWebGLDataTypeEnum(value) {
    const isNumber = typeof value === 'number';
    return isNumber && value >= 0x1400 && value <= 0x1406;
}

function componentTypeToInteger(value) {
    if (value === 'BYTE') {
        return 0x1400;
    }
    if (value === 'UNSIGNED_BYTE') {
        return 0x1401;
    }
    if (value === 'SHORT') {
        return 0x1402;
    }
    if (value === 'UNSIGNED_SHORT') {
        return 0x1403;
    }
    if (value === 'INT') {
        return 0x1404;
    }
    if (value === 'UNSIGNED_INT') {
        return 0x1405;
    }
    if (value === 'FLOAT') {
        return 0x1406;
    }
    throw new Error(`Unknown component type string: ${  value}`);
}

function elementTypeToCount(value) {
    if (value === 'VEC4') {
        return 4;
    }
    if (value === 'VEC3') {
        return 3;
    }
    if (value === 'VEC2') {
        return 2;
    }
    if (value === 'SCALAR') {
        return 1;
    }
    throw Error(`Unknown value${  value}`);
}

function webglDataTypeToByteSize(value) {
    if (value === 0x1400) {
        return 1;
    } // Byte
    if (value === 0x1401) {
        return 1;
    } // Unsigned Byte
    if (value === 0x1402) {
        return 2;
    } // Short
    if (value === 0x1403) {
        return 2;
    } // Unsigned Short
    if (value === 0x1404) {
        return 4;
    } // Int
    if (value === 0x1405) {
        return 4;
    } // Unsigned Int
    if (value === 0x1406) {
        return 4;
    } // Float
    throw new Error(`Unknown WebGL data type: ${  value}`);
}
