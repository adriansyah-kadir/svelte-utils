import { box } from "./boxed.svelte";
import type { Getter } from "./types";

export function debounced<T>(getter: Getter<T>, timeout = 500) {
  const value = box(getter())

  $effect(() => {
    const v = getter();
    return clearTimeout.bind(null, setTimeout(
      () => (value.current = v),
      timeout
    ))
  })

  return value
}
