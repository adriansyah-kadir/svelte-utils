import { isPromise } from "./checks"
import type { Fn } from "./types"

export const noop = () => { }

type Handler = Fn<any, [unknown]>
type DefaultHandler = Fn<void, [unknown]>

/** Return type: promises stay promises, sync results stay sync. Distributes over unions. */
type Caught<R, H extends Handler> =
  R extends PromiseLike<infer V>
    ? Promise<V | Awaited<ReturnType<H>>>
    : R | ReturnType<H>

export const catcher = <F extends Fn<any, any>, C extends Handler = DefaultHandler>(
  f: F,
  c: C = noop as unknown as C,
  ...a: Parameters<F>
): Caught<ReturnType<F>, C> => {
  try {
    const o = f(...a)
    return (isPromise(o) ? o.catch(c) : o) as Caught<ReturnType<F>, C>
  } catch (e) {
    return c(e) as Caught<ReturnType<F>, C>
  }
}
