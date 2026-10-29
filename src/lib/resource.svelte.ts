import { onDestroy } from "svelte"
import { isPromise } from "./checks"
import type { Fn } from "./types"

type AnyFn = Fn<any, any>

export interface Resource<F extends AnyFn, E = unknown> {
  readonly fetching: boolean
  readonly value: Awaited<ReturnType<F>> | undefined
  readonly error: E | undefined
  success(): this is { readonly value: Awaited<ReturnType<F>> }
  failed(): this is { readonly error: E }
  refetch(...args: Parameters<F>): ReturnType<F>
  reset(): void
}

/**
 * Reactive wrapper around a sync or async function.
 *
 * - Sync functions settle immediately, so `value`/`error` are populated during
 *   SSR and on first client render. `fetching` never becomes true.
 * - Async functions settle later. With `initial`, the call starts at init but is
 *   only tracked from `onMount`, so SSR output and hydration stay identical.
 *
 * Concurrency model: "latest call wins". Every call gets an incrementing id and
 * only the current id may write state. A superseded call still resolves or
 * rejects for its own caller.
 *
 * Must be called during component initialisation.
 */
export function useResource<F extends AnyFn, E = unknown>(
  fetch: F,
): Resource<F> {
  type Value = Awaited<ReturnType<F>>

  let latestId = 0

  let fetching = $state(false)
  let value = $state<Value>()
  let error = $state<E>()
  let success = $state<boolean>()

  const invalidate = () => ++latestId
  const isCurrent = (id: number) => id === latestId

  function succeed(id: number, result: Value) {
    if (!isCurrent(id)) return
    value = result
    error = undefined
    success = true
    fetching = false
  }

  function fail(id: number, e: unknown) {
    if (!isCurrent(id)) return
    error = e as E
    success = false
    fetching = false
  }

  /** Marks the request as in flight and settles state when it finishes. */
  function track(id: number, promise: Promise<Value>): Promise<Value> {
    if (isCurrent(id)) fetching = true
    return promise.then(
      (result) => {
        succeed(id, result);
        return result
      },
      (e) => {
        fail(id, e)
        throw e;
      },
    )
  }

  function refetch(...args: Parameters<F>): ReturnType<F> {
    const id = invalidate()
    try {
      const out = fetch(...args)
      if (isPromise<Value>(out)) track(id, out);
      else succeed(id, out);
      return out
    } catch (e) {
      fail(id, e)
      throw e
    }
  }

  function reset() {
    invalidate()
    value = undefined
    error = undefined
    success = undefined
    fetching = false
  }

  onDestroy(invalidate)

  return {
    get fetching() { return fetching },
    get value() { return value },
    get error() { return error },

    success(): this is { value: Awaited<ReturnType<F>> } { return success === true },
    failed(): this is { error: E } { return success === false },

    refetch,
    reset,
  }
}
