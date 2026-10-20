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
 * deep = true make this deep proxy so box.x.y is interpreted as box.current = {...box.current: [x]: {...box.current[x], y}}
**/
export function boxFlat<T extends Record<string, any>>(boxed: Box<T>, deep = false) {
  return new Proxy({} as T, {
    get: (_, p: string) => {
      const value = Reflect.get(boxed.current, p)
      if (typeof value !== "object" || value === null || !deep) return value
      return boxFlat(box(
        () => boxed.current[p],
        nValue => (boxed.current = { ...boxed.current, [p]: nValue })
      ))
    },

    set(_, p: string, value) {
      boxed.current = { ...boxed.current, [p]: value }
      return true
    },

    deleteProperty(_, p) {
      const { [p as string]: _removed, ...rest } = boxed.current
      boxed.current = rest as T
      return true
    },

    has: (_, p) => p in boxed.current,
    ownKeys: () => Reflect.ownKeys(boxed.current),

    getOwnPropertyDescriptor(_, p) {
      const d = Reflect.getOwnPropertyDescriptor(boxed.current, p)
      // The target is `{}`, so the proxy invariant requires configurable: true.
      return d && { ...d, configurable: true }
    },
  })
}
