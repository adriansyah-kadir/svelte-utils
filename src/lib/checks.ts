export function isPromise<T>(value: unknown): value is PromiseLike<T> {
  return (
    value != null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  )
}
/**
 * check: typeof v === "object" && v !== null
**/
export function isObject(v: any): v is Record<PropertyKey, any> {
  return typeof v === "object" && v !== null
}
