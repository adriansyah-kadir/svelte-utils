export type Constructor<T, A extends unknown[] = unknown[]> =
  new (...args: A) => T;

export type Fn<O = any, A extends unknown[] = unknown[]> = (...any: A) => O
