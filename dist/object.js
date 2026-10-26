export function pick(obj, keys) {
    const result = {};
    for (const key of keys) {
        result[key] = obj[key];
    }
    return result;
}
export function omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}
/** For each key, use `primary`'s value unless it is null/undefined, else `fallback`'s. */
export function coalesce(primary, fallback) {
    const result = { ...fallback };
    if (primary) {
        for (const key of Object.keys(primary)) {
            const v = primary[key];
            if (v != null)
                result[key] = v;
        }
    }
    return result;
}
