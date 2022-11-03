/* eslint-disable */
"use strict";

const seedrandom = require("seedrandom");
const defaultValue = require("./defaultValue");

/**
 * Performs a Fisher-Yates shuffle on the given array, in-place,
 * and returns it.
 *
 * @param {Array} array The array
 * @param {String} seed The optional random seed
 * @returns The given array
 */
function shuffleArray(array, seed) {
  const random = seedrandom(defaultValue(seed, "0"));
  for (let i = array.length - 1; i > 0; i--) {
    const r = random.int32();
    const n = i + 1;
    const j = ((r % n) + n) % n;
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

module.exports = shuffleArray;
