'use strict';
var validateB3dm = require('../../lib/validateB3dm');

describe('validateB3dm', function() {
    it('validated is a b3dm tile', function(done) {
        //what gets passed validateB3dm
        expect(validateB3dm( )).toBe(true);
    });

    it('validated is not a b3dm tile', function(done) {
        expect(validateB3dm( )).toBe(false);
    });
});

