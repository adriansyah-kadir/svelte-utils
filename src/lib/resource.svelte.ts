import { onDestroy } from "svelte"
import { isPromise } from "./checks"
import type { Fn } from "./types"

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
export function useResource<E, F extends Fn<any, any>>(fn: F) {
  type V = Awaited<ReturnType<F>>

  let latest = 0
  const invalidate = () => ++latest

  let fetching = $state(false)
  let value = $state.raw<V>()
  let error = $state.raw<E>()
  let success = $state<boolean>()

  function succeed(id: number, result: V) {
    if (latest !== id) return
    value = result
    error = undefined
    success = true
    fetching = false
  }

  function fail(id: number, e: E) {
    if (latest !== id) return
    error = e as E
    success = false
    fetching = false
  }

  /** Marks the request as in flight and settles state when it finishes. */
  function refetch(...args: Parameters<F>): ReturnType<F> {
    const id = invalidate()
    try {
      const out = fn(...args)
      if (isPromise<V>(out)) {
        fetching = true;
        out.then(r => succeed(id, r), e => fail(id, e))
      } else {
        succeed(id, out)
      }
      return out
    } catch (e) {
      fail(id, e as E)
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

    success(): this is { value: V } { return success === true },
    failed(): this is { error: E } { return success === false },

    refetch,
    reset,
  }
}
