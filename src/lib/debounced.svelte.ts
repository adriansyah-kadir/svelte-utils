import { box } from "./boxed.svelte";
import { watch } from "./effect.svelte";
import type { Getter } from "./types";

export function useDebounced<T>(getter: Getter<T>, timeout = 500) {
  const value = box(getter())

  watch(getter, v => {
    return clearTimeout.bind(null, setTimeout(
      () => (value.current = v),
      timeout
    ))
  })

  return value
}
