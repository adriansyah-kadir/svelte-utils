import { box } from "#lib";
import type { Getter } from "./types";

export function debounced<T>(getter: Getter<T>, timeout = 500) {
  const value = box(getter())

  $effect(() => {
    return clearTimeout(setTimeout(() => {
      value.current = getter()
    }, timeout))
  })

  return value
}
