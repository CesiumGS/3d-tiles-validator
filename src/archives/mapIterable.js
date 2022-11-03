/* eslint-disable */
"use strict";

/**
 * Creates an iterable from the given one, applying the
 * given function to each element.
 *
 * @param {Iterable} iterable The iterable object
 * @param {Function} mapper The mapper function
 * @returns The mapped iterable
 */
function mapIterable(iterable, mapper) {
  const iterator = iterable[Symbol.iterator]();

  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      const result = iterator.next();
      if (result.done) {
        return { done: true };
      }
      const mappedValue = mapper(result.value);
      return { value: mappedValue, done: false };
    },
  };
}

module.exports = mapIterable;
