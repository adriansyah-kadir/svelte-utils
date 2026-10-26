export const isPromise = (v) => typeof v?.then === "function";
/**
 * check: typeof v === "object" && v !== null
**/
export function isObject(v) {
    return typeof v === "object" && v !== null;
}
export function deepEqual(a, b, seen = new WeakMap()) {
    if (Object.is(a, b))
        return true; // primitives, same ref, NaN === NaN
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
        return false;
    }
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
        return false;
    // cycle guard: if we're already comparing `a` against `b`, assume equal
    if (seen.get(a) === b)
        return true;
    seen.set(a, b);
    if (a instanceof Date)
        return Object.is(a.getTime(), b.getTime());
    if (a instanceof RegExp) {
        return a.source === b.source && a.flags === b.flags;
    }
    if (Array.isArray(a)) {
        const bb = b;
        return a.length === bb.length && a.every((v, i) => deepEqual(v, bb[i], seen));
    }
    if (ArrayBuffer.isView(a)) {
        const x = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
        const bv = b;
        const y = new Uint8Array(bv.buffer, bv.byteOffset, bv.byteLength);
        return x.length === y.length && x.every((v, i) => v === y[i]);
    }
    if (a instanceof Map) {
        const bm = b;
        if (a.size !== bm.size)
            return false;
        for (const [k, v] of a) {
            if (!bm.has(k) || !deepEqual(v, bm.get(k), seen))
                return false;
        }
        return true;
    }
    if (a instanceof Set) {
        const bs = b;
        if (a.size !== bs.size)
            return false;
        outer: for (const v of a) {
            if (bs.has(v))
                continue; // fast path: same reference / primitive
            for (const w of bs) {
                if (deepEqual(v, w, seen))
                    continue outer;
            }
            return false;
        }
        return true;
    }
    // plain objects / class instances: own enumerable string keys
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length)
        return false;
    for (const key of ka) {
        if (!Object.hasOwn(b, key))
            return false;
        if (!deepEqual(a[key], b[key], seen))
            return false;
    }
    return true;
}
