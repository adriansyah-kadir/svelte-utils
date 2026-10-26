export declare const isPromise: <T>(v: T | Promise<T>) => v is Promise<T>;
/**
 * check: typeof v === "object" && v !== null
**/
export declare function isObject(v: any): v is Record<PropertyKey, any>;
export declare function deepEqual(a: unknown, b: unknown, seen?: WeakMap<object, object>): boolean;
