// https://stackoverflow.com/a/59003541
export type AtLeastOne<T> = { [K in keyof T]: { [K2 in K]: T[K] } }[keyof T] &
    Partial<T>;
