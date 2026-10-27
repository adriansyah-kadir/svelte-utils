import { building } from "$app/env";
import { goto, type GotoOptions } from "$app/navigation";
import { page, type ReadonlyURLSearchParams } from "$app/state";
import { box } from "./boxed.svelte";
import { isObject } from "./checks";

type Decoder<T> = (search: ReadonlyURLSearchParams) => T
type Encoder<T> = (value: T) => URLSearchParams
type Parser<T> = {
  decode: Decoder<T>,
  encode?: Encoder<T>
} | Decoder<T>

function _encoder<T>(value: T) {
  const search = new URLSearchParams()
  if (isObject(value)) Object.entries(value).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(search.append.bind(search, k));
    else if (v !== undefined && v !== null) search.set(k, String(v))
  }); else search.set("q", String(value))
  return search
}

export function useSearchParams<T>(
  parser: Parser<T>,
  opts?: GotoOptions & { enabled?: boolean },
) {
  const enabled = $derived(opts?.enabled ?? !building)
  const search = $derived(!enabled ? new URLSearchParams() : page.url.searchParams)
  const decoder = typeof parser === "function" ? parser : parser.decode
  const encoder = typeof parser === "function" ? _encoder : parser.encode ?? _encoder

  const params = box<T>(
    () => decoder(search),
    next => {
      if (!enabled) return;
      const s = encoder(next)
      goto(s.size > 0 ? `?${s}` : page.url.pathname, { reset: false, ...opts })
    },
  )

  return {
    get current() { return box.flat(params, true) },
    set current(v) { params.current = v },
    clear() {
      if (!enabled || page.url.searchParams.size === 0) return;
      goto(page.url.pathname, { reset: false, ...opts })
    }
  }
}
