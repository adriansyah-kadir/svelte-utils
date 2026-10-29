export const isPromise = <T>(v: T | Promise<T>): v is Promise<T> =>
  typeof (v as any)?.then === "function"

/**
 * check: typeof v === "object" && v !== null
**/
export function isObject(v: any): v is Record<PropertyKey, any> {
  return typeof v === "object" && v !== null
}
