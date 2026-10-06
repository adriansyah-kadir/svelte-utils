export type Constructor<T, A extends unknown[] = unknown[]> =
  new (...args: A) => T;

export type Fn<O = any, A extends unknown[] = unknown[]> = (...any: A) => O

export type Getter<T = unknown> = () => T
export type Setter<T = unknown, O = any> = (value: T) => O
export type MaybeGetter<T = unknown> = (() => T) | T
