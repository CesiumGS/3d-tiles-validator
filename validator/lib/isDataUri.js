'use strict';

module.exports = isDataUri;

const dataUriRegex = /^data:/i;

function isDataUri(uri) {
    return dataUriRegex.test(uri);
}
