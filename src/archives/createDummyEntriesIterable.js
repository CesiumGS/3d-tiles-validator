/* eslint-disable */
"use strict";

const seedrandom = require("seedrandom");
const defaultValue = require("./defaultValue");

/**
 * Creates a generator that allows iterating over "dummy" entries
 * for a 3D tiles archive.
 *
 * Each entry will have the following properties:
 * - key : The path (as a string), with a dummy file name
 * - value : A buffer with dummy data for the entry
 *
 * The sizes of the buffers will be randomized in the specified
 * range, with the given random seed.
 *
 * @param {Number} numEntries The number of entries to generate
 * @param {Number} minSize The minimum size of an entry, inclusive
 * @param {Number} maxSize The maximum size of an entry, exclusive
 * @param {String} [seed] The optional random seed
 * @return The generator for entry objects
 */
function* createDummyEntriesIterable(numEntries, minSize, maxSize, seed) {
  const random = seedrandom(defaultValue(seed, "0"));
  const templateBuffer = Buffer.alloc(maxSize);
  let index = 0;
  while (index < numEntries) {
    const key = "example" + index + ".glb";
    const r = random();
    const size = Math.floor(minSize + r * (maxSize - minSize));
    const buffer = templateBuffer.slice(0, size);
    const entry = {
      key: key,
      value: buffer,
    };
    index++;
    yield entry;
  }
}

module.exports = createDummyEntriesIterable;
