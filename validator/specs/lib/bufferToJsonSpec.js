'use strict';
const bufferToJson = require('../../lib/bufferToJson');

describe('bufferToJson', () => {
    it('empty buffer returns empty object', () => {
        const buffer = Buffer.alloc(0);
        const result = bufferToJson(buffer);
        expect(result).toEqual({});
    });

    it('converts buffer to JSON object', () => {
        const json = {
            version: 1
        };
        const buffer = Buffer.from(JSON.stringify(json));
        const result = bufferToJson(buffer);
        expect(result).toEqual(json);
    });
});
