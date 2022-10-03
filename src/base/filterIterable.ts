/**
 * Returns filtered view on the given iterable
 *
 * @param iterable The iterable
 * @param include The include predicate
 * @returns The filtered iterable
 */
export function filterIterable<T>(
  iterable: IterableIterator<T>,
  include: (element: T) => boolean
) {
  const iterator = iterable[Symbol.iterator]();
  return {
    [Symbol.iterator]() {
      return this;
    },
    next(): IteratorResult<T, void> {
      for (;;) {
        const result = iterator.next();
        if (result.done) {
          return { value: undefined, done: true };
        }
        const included = include(result.value);
        if (included) {
          return { value: result.value, done: false };
        }
      }
    },
  };
}
