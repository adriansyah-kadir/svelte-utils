import { deepEqual, isObject, watch, type Getter, type Setter } from "."

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

export function boxFlat<T>(outer: Box<T>, deep = false): T {
  const initial = outer.current

  // Not an object: nothing to proxy, return the value directly
  if (!isObject(initial)) return initial

  return new Proxy(outer as Box<T & Record<string, any>>, {
    get: (t, p: string) => {
      const inner = box(
        () => t.current[p],
        nValue => (t.current = { ...t.current, [p]: nValue })
      )
      if (!isObject(inner.current) || !deep) return inner.current
      return Array.isArray(inner.current) ? boxArray(inner) : boxFlat(inner)
    },

    set(t, p: string, value) {
      t.current = { ...t.current, [p]: value }
      return true
    },

    deleteProperty(t, p) {
      const { [p as string]: _removed, ...rest } = t.current as any
      t.current = rest
      return true
    },

    has: (t, p) => p in t.current,
    ownKeys: (t) => Reflect.ownKeys(t.current),

    getOwnPropertyDescriptor(t, p) {
      const d = Reflect.getOwnPropertyDescriptor(t.current, p)
      // The target is `{}`, so the proxy invariant requires configurable: true.
      return d && { ...d, configurable: true }
    },
  }) as T
}

const MUTATORS = new Set(["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"]);

export function boxArray<T>(b: Box<T[]>): T[] {
  // Target is a real array so Array.isArray() works
  return new Proxy([] as T[], {
    get(_, p) {
      const arr = b.current;
      const v = Reflect.get(arr, p);
      if (typeof v !== "function") return v;
      if (typeof p === "string" && MUTATORS.has(p)) {
        return (...args: any[]) => {
          const copy = [...arr];
          const result = (copy as any)[p](...args);
          b.current = copy;
          return result;
        };
      }
      return v.bind(arr); // map, filter, iterator, etc. read from the current value
    },
    set(_, p, value) {
      const copy = [...b.current] as any;
      copy[p] = value; // also handles `arr.length = 0` and `arr[i] = x`
      b.current = copy;
      return true;
    },
    has: (_, p) => p in b.current,
    ownKeys: () => Reflect.ownKeys(b.current),
    getOwnPropertyDescriptor(_, p) {
      const d = Reflect.getOwnPropertyDescriptor(b.current, p);
      // `length` is non-configurable on the [] target, so it must be reported as such
      return d && { ...d, configurable: p !== "length" };
    },
  });
}

export function boxLink<T>(own: Box<T>, other: Box<T>) {
  watch(() => own.current, (v) => {
    if (!deepEqual(v, other.current)) other.current = v;
  });
  watch(() => other.current, (v) => {
    if (!deepEqual(v, own.current)) own.current = v;
  });
}
