import type { Getter, Setter } from "#lib"

export type Box<T> = { current: T }

export function boxState<T>(
  initial: T,
  setter: Setter<T, T> = t => t
) {
  let current = $state(initial)
  return {
    get current() { return current },
    set current(value: T) { current = setter(value) }
  }
}

export function boxDerived<T>(
  getter: Getter<T>,
  setter?: Setter<T>
) {
  const current = $derived.by(getter)
  return {
    get current() { return current },
    set current(value: T) { setter?.(value) }
  }
}

export function box<T>(
  getterOrInitial: Getter<T> | T,
  setter?: Setter<T>
): Box<T> {
  return typeof getterOrInitial === "function"
    ? boxDerived(getterOrInitial as Getter<T>, setter)
    : boxState(getterOrInitial, setter)
}
