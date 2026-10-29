import { dequal } from "dequal";
import { isObject, watch, type Getter, type MaybeGetter, type Setter } from "."

const MUTATORS = new Set(["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"]);

export type Box<T> = { current: T }

function _state<T>(
  initial: T,
  setter: Setter<T, T> = t => t
) {
  let current = $state(initial)
  return {
    get current() { return current },
    set current(value: T) { current = setter(value) }
  }
}

function _derived<T>(
  getter: Getter<T>,
  setter?: Setter<T>
) {
  const current = $derived.by(getter)
  return {
    get current() { return current },
    set current(value: T) { setter?.(value) }
  }
}

function _box<T>(
  getterOrInitial: MaybeGetter<T>,
  setter?: Setter<T>
): Box<T> {
  return typeof getterOrInitial === "function"
    ? _derived(getterOrInitial as Getter<T>, setter)
    : _state(getterOrInitial, setter)
}

function _link<T>(own: Box<T>, other: Box<T>) {
  watch(() => own.current, (v) => {
    if (!dequal(v, other.current)) other.current = v;
  });
  watch(() => other.current, (v) => {
    if (!dequal(v, own.current)) own.current = v;
  });
}

function _flat<T>(outer: Box<T>, deep = false): T {
  const initial = outer.current
  const get = (p: string) => (outer.current as any)[p]
  const set = (p: string, v: any) => {
    outer.current = {
      ...outer.current,
      [p]: v
    }
  }

  // Not an object: nothing to proxy, return the value directly
  if (!isObject(initial)) return initial

  return new Proxy(initial, {
    get: (_, p: string) => {
      const inner = box(() => get(p), v => set(p, v))
      if (!isObject(inner.current) || !deep) return inner.current
      return Array.isArray(inner.current) ? _array(inner) : _flat(inner)
    },

    set(_, p: string, v) {
      set(p, v)
      return true
    },

    deleteProperty(_, p) {
      const { [p as string]: _removed, ...rest } = outer.current as any
      outer.current = rest
      return true
    },

    has: (_, p) => Object.hasOwn(outer.current as object, p),
    ownKeys: (_) => Object.getOwnPropertyNames(outer.current),

    getOwnPropertyDescriptor(_, p) {
      const d = Object.getOwnPropertyDescriptor(outer.current, p)
      // The target is `{}`, so the proxy invariant requires configurable: true.
      return d && { ...d, configurable: true }
    },
  }) as T
}

export function _array<T>(b: Box<T[]>): T[] {
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

export const box = Object.assign(_box, {
  state: _state,
  derived: _derived,
  flat: _flat,
  array: _array,
  link: _link
})
