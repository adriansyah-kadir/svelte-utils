import { onDestroy, onMount } from "svelte"
import type { Fn } from "."

type AsyncFn = Fn<Promise<any>, any>
type Result<F extends AsyncFn> = Awaited<ReturnType<F>>

export interface Resource<F extends AsyncFn, E = unknown> {
  readonly fetching: boolean
  readonly value: Result<F> | undefined
  readonly error: E | undefined
  success(): this is { value: Result<F> }
  failed(): this is { error: E }
  refetch(...args: Parameters<F>): Promise<Result<F>>
  reset(): void
}

const noop = () => { }

/**
 * Reactive wrapper around an async function.
 *
 * Concurrency model: "latest call wins".
 * Every `refetch` gets an incrementing id. Only the call whose id is still
 * current may write to state, so a superseded call (or one that finishes after
 * `reset()` / unmount) never changes `value`, `error`, `success` or `fetching`.
 * A superseded call still resolves/rejects for its own caller.
 *
 * @param fetch   The async function to wrap.
 * @param initial Arguments for an automatic fetch on mount. Omit to skip.
 *
 * Must be called during component initialisation (uses `onMount`).
 */
export function useResource<F extends AsyncFn, E = unknown>(
  fetch: F,
  ...initial: Parameters<F>
): Resource<F, E> {
  let latestId = 0

  // ── Reactive state ──────────────────────────────────────────
  let fetching = $state(false)
  let value = $state<Result<F>>()
  let error = $state<E>()
  let success = $state<boolean>()

  /** Bump the id so every older in-flight request becomes stale. Returns the new id. */
  const invalidate = () => ++latestId
  const isCurrent = (id: number) => id === latestId

  async function refetch(...args: Parameters<F>): Promise<Result<F>> {
    const id = invalidate() // supersedes any previous request
    fetching = true

    try {
      const result: Result<F> = await fetch(...args)
      if (isCurrent(id)) {
        value = result
        error = undefined
        success = true
      }
      return result
    } catch (e) {
      if (isCurrent(id)) {
        error = e as E
        success = false
      }
      throw e
    } finally {
      if (isCurrent(id)) fetching = false
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

  onMount(() => {
    if (initial) refetch(...initial).catch(noop)
  })

  return {
    get fetching() { return fetching },
    get value() { return value },
    get error() { return error },

    // ── Type guards ───────────────────────────────────────────
    success(): this is { value: Result<F> } {
      return success === true
    },
    failed(): this is { error: E } {
      return success === false
    },

    refetch,
    reset,
  }
}
