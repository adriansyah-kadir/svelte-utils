import { isObject } from ".";
export function boxState(initial, setter = t => t) {
    let current = $state(initial);
    return {
        get current() { return current; },
        set current(value) { current = setter(value); }
    };
}
export function boxDerived(getter, setter) {
    const current = $derived.by(getter);
    return {
        get current() { return current; },
        set current(value) { setter?.(value); }
    };
}
export function box(getterOrInitial, setter) {
    return typeof getterOrInitial === "function"
        ? boxDerived(getterOrInitial, setter)
        : boxState(getterOrInitial, setter);
}
export function boxFlat(outer, deep = false) {
    const initial = outer.current;
    // Not an object: nothing to proxy, return the value directly
    if (!isObject(initial))
        return initial;
    return new Proxy(outer, {
        get: (t, p) => {
            const inner = box(() => t.current[p], nValue => (t.current = { ...t.current, [p]: nValue }));
            if (!isObject(inner.current) || !deep)
                return inner.current;
            return Array.isArray(inner.current) ? boxArray(inner) : boxFlat(inner);
        },
        set(t, p, value) {
            t.current = { ...t.current, [p]: value };
            return true;
        },
        deleteProperty(t, p) {
            const { [p]: _removed, ...rest } = t.current;
            t.current = rest;
            return true;
        },
        has: (t, p) => p in t.current,
        ownKeys: (t) => Reflect.ownKeys(t.current),
        getOwnPropertyDescriptor(t, p) {
            const d = Reflect.getOwnPropertyDescriptor(t.current, p);
            // The target is `{}`, so the proxy invariant requires configurable: true.
            return d && { ...d, configurable: true };
        },
    });
}
const MUTATORS = new Set(["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"]);
export function boxArray(b) {
    // Target is a real array so Array.isArray() works
    return new Proxy([], {
        get(_, p) {
            const arr = b.current;
            const v = Reflect.get(arr, p);
            if (typeof v !== "function")
                return v;
            if (typeof p === "string" && MUTATORS.has(p)) {
                return (...args) => {
                    const copy = [...arr];
                    const result = copy[p](...args);
                    b.current = copy;
                    return result;
                };
            }
            return v.bind(arr); // map, filter, iterator, etc. read from the current value
        },
        set(_, p, value) {
            const copy = [...b.current];
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
