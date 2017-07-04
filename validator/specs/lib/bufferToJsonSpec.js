'use strict';
var bufferToJson = require('../../lib/bufferToJson');

describe('bufferToJson', function() {
    it('empty buffer returns empty object', function() {
        var buffer = Buffer.alloc(0);
        var result = bufferToJson(buffer);
        expect(result).toEqual({});
    });

    it('converts buffer to JSON object', function() {
        var json = {
            version : 1
        };
        var buffer = Buffer.from(JSON.stringify(json));
        var result = bufferToJson(buffer);
        expect(result).toEqual(json);
    });

});
