export const isPromise = <T>(v: T | Promise<T>): v is Promise<T> =>
  typeof (v as any)?.then === "function"

/**
 * check: typeof v === "object" && v !== null
**/
export function isObject(v: any): v is Record<PropertyKey, any> {
  return typeof v === "object" && v !== null
}

export function deepEqual(
  a: unknown,
  b: unknown,
  seen: WeakMap<object, object> = new WeakMap(),
): boolean {
  if (Object.is(a, b)) return true; // primitives, same ref, NaN === NaN

  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }

  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

  // cycle guard: if we're already comparing `a` against `b`, assume equal
  if (seen.get(a) === b) return true;
  seen.set(a, b);

  if (a instanceof Date) return Object.is(a.getTime(), (b as Date).getTime());

  if (a instanceof RegExp) {
    return a.source === (b as RegExp).source && a.flags === (b as RegExp).flags;
  }

  if (Array.isArray(a)) {
    const bb = b as unknown[];
    return a.length === bb.length && a.every((v, i) => deepEqual(v, bb[i], seen));
  }

  if (ArrayBuffer.isView(a)) {
    const x = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
    const bv = b as ArrayBufferView;
    const y = new Uint8Array(bv.buffer, bv.byteOffset, bv.byteLength);
    return x.length === y.length && x.every((v, i) => v === y[i]);
  }

  if (a instanceof Map) {
    const bm = b as Map<unknown, unknown>;
    if (a.size !== bm.size) return false;
    for (const [k, v] of a) {
      if (!bm.has(k) || !deepEqual(v, bm.get(k), seen)) return false;
    }
    return true;
  }

  if (a instanceof Set) {
    const bs = b as Set<unknown>;
    if (a.size !== bs.size) return false;
    outer: for (const v of a) {
      if (bs.has(v)) continue; // fast path: same reference / primitive
      for (const w of bs) {
        if (deepEqual(v, w, seen)) continue outer;
      }
      return false;
    }
    return true;
  }

  // plain objects / class instances: own enumerable string keys
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;

  for (const key of ka) {
    if (!Object.hasOwn(b, key)) return false;
    if (!deepEqual((a as any)[key], (b as any)[key], seen)) return false;
  }
  return true;
}
