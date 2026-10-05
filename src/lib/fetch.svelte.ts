import { onMount } from "svelte"
import type { Fn } from "."

type AsyncFn = Fn<Promise<any>, any>
type Result<F extends AsyncFn> = Awaited<ReturnType<F>>

export type FetchOpts<F extends AsyncFn> = {
  fetch: F
  /** Arguments for an automatic fetch on mount. Omit to skip. */
  initial?: Parameters<F>
}

const noop = () => {}

/**
 * Reactive wrapper around an async function.
 *
 * Concurrency model: "latest call wins".
 * Every `refetch` gets an incrementing id. Only the call whose id is still
 * current may write to state, so a superseded call (or one that finishes after
 * `reset()` / unmount) never changes `value`, `error`, `success` or `fetching`.
 * A superseded call still resolves/rejects for its own caller.
 *
 * Must be created during component initialisation (uses `onMount`).
 */
export class FetchState<F extends AsyncFn, E = unknown> {
  readonly #fetch: F
  #requestId = 0

  // ── Reactive state ──────────────────────────────────────────
  #fetching = $state(false)
  #value = $state<Result<F>>()
  #error = $state<E>()
  #success = $state<boolean>()

  get fetching() { return this.#fetching }
  get value() { return this.#value }
  get error() { return this.#error }

  // ── Type guards ─────────────────────────────────────────────
  success(): this is { value: Result<F> } {
    return this.#success === true
  }

  failed(): this is { error: E } {
    return this.#success === false
  }

  constructor({ fetch, initial }: FetchOpts<F>) {
    this.#fetch = fetch

    onMount(() => {
      // Error is already captured in state; swallow to avoid an unhandled rejection.
      if (initial) this.refetch(...initial).catch(noop)

      // Ignore any request still in flight once the component is gone.
      return () => this.#invalidate()
    })
  }

  async refetch(...args: Parameters<F>): Promise<Result<F>> {
    const id = this.#invalidate() // supersedes any previous request
    this.#fetching = true

    try {
      const result: Result<F> = await this.#fetch(...args)
      if (this.#isCurrent(id)) this.#onSuccess(result)
      return result
    } catch (e) {
      if (this.#isCurrent(id)) this.#onError(e as E)
      throw e
    } finally {
      if (this.#isCurrent(id)) this.#fetching = false
    }
  }

  reset = () => {
    this.#invalidate()
    this.#value = undefined
    this.#error = undefined
    this.#success = undefined
    this.#fetching = false
  }

  /** Bump the id so every older in-flight request becomes stale. Returns the new id. */
  #invalidate() {
    return ++this.#requestId
  }

  #isCurrent(id: number) {
    return id === this.#requestId
  }

  #onSuccess(result: Result<F>) {
    this.#value = result
    this.#error = undefined
    this.#success = true
  }

  #onError(error: E) {
    this.#error = error
    this.#success = false
  }
}
