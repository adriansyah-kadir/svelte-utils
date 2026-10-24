export const isPromise = (v) => typeof v?.then === "function";
/**
 * check: typeof v === "object" && v !== null
**/
export function isObject(v) {
    return typeof v === "object" && v !== null;
}
