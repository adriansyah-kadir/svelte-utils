export function isPromise<T>(v: any): v is Promise<T> {
  return "then" in v && typeof v.then === "function"
}

/**
 * check: typeof v === "object" && v !== null
**/
export function isObject(v: any): v is Record<PropertyKey, any> {
  return typeof v === "object" && v !== null
}
