import { toStore } from "svelte/store"

export function stateChange<T, R extends T>(
  get: () => T,
  predicate: (value: T) => value is R
): Promise<R>

export function stateChange<T>(
  get: () => T,
  predicate: (value: T) => boolean
): Promise<T>

export function stateChange<T>(
  get: () => T,
  predicate: (value: T) => boolean
): Promise<T> {
  const store = toStore(get)
  const { promise, resolve } = Promise.withResolvers<T>()

  const unsubscribe = store.subscribe(value => {
    if (predicate(value)) resolve(value)
  })

  promise.then(() => unsubscribe())
  return promise
}
