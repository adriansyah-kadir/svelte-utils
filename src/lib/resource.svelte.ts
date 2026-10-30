import { untrack } from "svelte"
import { isPromise } from "./checks"
import type { Fn } from "./types"

export type Reason = "supersede" | "cancel" | "reset" | "destroy"
type Opts<F extends Fn<any, any>, E> = {
  initial?: Awaited<ReturnType<F>>,
  cleanup?: Fn<[{
    args: Parameters<F>,
    loading: boolean,
    reason: Reason,
    value: Awaited<ReturnType<F>> | undefined,
    error: E | undefined
  }]>
}

export function useAction<E, F extends Fn<any, any>>(
  action: F,
  opts?: Opts<F, E>
) {
  type V = Awaited<ReturnType<F>>
  let current = {
    id: 0,
    args: undefined as Parameters<F> | undefined
  }
  const isCurrent = (id: number) => id === current.id

  let loading = $state(false)
  let value = $state.raw<V | undefined>(opts?.initial)
  let error = $state.raw<E>()
  let success = $state<boolean>()

  function retire(reason: Reason) {
    const { args, id } = current
    current = { id: id + 1, args: undefined }
    if (args !== undefined && opts?.cleanup) {
      try {
        opts.cleanup({ args, error, loading, reason, value })
      } catch (e) {
        console.error(e)
      }
    }
    return current.id
  }

  function succeed(id: number, result: V) {
    if (!isCurrent(id)) return
    value = result
    error = undefined
    success = true
    loading = false
  }

  function fail(id: number, e: E) {
    if (!isCurrent(id)) return
    error = e as E
    success = false
    loading = false
  }

  /** Marks the request as in flight and settles state when it finishes. */
  function run(...args: Parameters<F>): ReturnType<F> {
    const id = retire("supersede")
    current = { args, id }
    try {
      const out = action(...args)
      if (isPromise<V>(out)) {
        loading = true;
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
    retire("reset")
    value = undefined
    error = undefined
    success = undefined
    loading = false
  }

  function cancel() {
    if (!loading) return;
    retire("cancel")
    loading = false;
  }

  $effect(() => () => untrack(() => retire("destroy")))

  return {
    get loading() { return loading },
    get value() { return value },
    get error() { return error },

    success(): this is { value: V } { return success === true },
    failed(): this is { error: E } { return success === false },

    cancel: () => untrack(cancel),
    run: (...args: Parameters<F>): ReturnType<F> => untrack(() => run(...args)),
    reset: () => untrack(reset),
  }
}
