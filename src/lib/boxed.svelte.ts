import type { Getter, Setter } from "."

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

/**
 * make a box.current = {...box.current, x: 100} simplified to box.x = 100
 * note this is not a deep box this only applied to first rank fields
 * so this doesn't work:
 * box.x.y = 100
**/
export function boxFlat<T extends Record<string, any>>(box: Box<T>): T {
  return new Proxy({} as T, {
    get: (_, p) => Reflect.get(box.current, p),

    set(_, p, value) {
      box.current = { ...box.current, [p]: value } as T
      return true
    },

    deleteProperty(_, p) {
      const { [p as string]: _removed, ...rest } = box.current
      box.current = rest as T
      return true
    },

    has: (_, p) => p in box.current,
    ownKeys: () => Reflect.ownKeys(box.current),

    getOwnPropertyDescriptor(_, p) {
      const d = Reflect.getOwnPropertyDescriptor(box.current, p)
      // The target is `{}`, so the proxy invariant requires configurable: true.
      return d && { ...d, configurable: true }
    },
  })
}
