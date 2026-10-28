import { building } from "$app/env";
import { goto, type GotoOptions } from "$app/navigation";
import { page, type ReadonlyURLSearchParams } from "$app/state";
import { deepEqual } from "./checks";
import { watch } from "./effect.svelte";

type SearchValues = string | string[] | null
type Decoder<T> = (...values: string[]) => T
type Encoder<T> = (value: T) => SearchValues
type Entry<T> = Decoder<T> | { decode: Decoder<T>, encode?: Encoder<T> }
type Parser<T extends Record<string, any>> = { [K in keyof T]: Entry<T[K]> }

const defaultEncode: Encoder<unknown> = v =>
  v == null ? null : Array.isArray(v) ? v.map(String) : String(v)

function _decode<T extends Record<string, any>>(
  parser: Parser<T>,
  search: ReadonlyURLSearchParams,
): T {
  const out = {} as T
  for (const k in parser) {
    const e = parser[k]
    const decode: Decoder<T[typeof k]> = typeof e === "function" ? e : e.decode
    out[k] = decode(...search.getAll(k))
  }
  return out
}

function _encode<T extends Record<string, any>>(
  parser: Parser<T>,
  value: T,
  base: Iterable<[string, string]>,
) {
  const next = new URLSearchParams([...base]) // keeps params that aren't ours
  for (const k in parser) {
    const e = parser[k]
    const encode = typeof e === "function" ? defaultEncode : e.encode ?? defaultEncode
    const out = encode(value[k])
    next.delete(k)
    if (out === null) continue
    for (const v of Array.isArray(out) ? out : [out]) next.append(k, v)
  }
  return next
}

const canon = (s: Iterable<[string, string]>) => {
  const c = new URLSearchParams([...s])
  c.sort()
  return c.toString()
}

export function useSearchParams<T extends Record<string, any>>(
  parser: Parser<T>,
  opts?: GotoOptions & { enabled?: boolean },
) {
  const enabled = $derived(opts?.enabled ?? !building)
  const params = $derived(!enabled ? new URLSearchParams() : page.url.searchParams)
  let value = $state(_decode(parser, params))

  const navigate = (params: URLSearchParams) => {
    const q = params.toString()
    return goto(`${page.url.pathname}${q ? `?${q}` : ""}${page.url.hash}`, {
      reset: false,
      ...opts,
    })
  }

  // URL -> state
  watch(() => _decode(parser, params), v => {
    if (!deepEqual(v, value)) value = v
  }, { lazy: true })

  // state -> URL
  watch(() => value, v => {
    if (!enabled) return
    if (deepEqual(_decode(parser, params), v)) return // URL already represents this state
    const next = _encode(parser, v, page.url.searchParams)
    if (canon(next) === canon(page.url.searchParams)) return
    navigate(next)
  }, { lazy: true })

  return {
    get current() { return value },
    set current(v) { value = v },
    clear(keys = Object.keys(parser) as (keyof T)[]) {
      if (!enabled) return
      const next = new URLSearchParams(page.url.search)
      for (const k of keys) next.delete(String(k));
      if (canon(next) === canon(page.url.searchParams)) return
      navigate(next)
    },
  }
}
