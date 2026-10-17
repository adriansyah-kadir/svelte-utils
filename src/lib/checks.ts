export const isPromise = <T>(v: T | Promise<T>): v is Promise<T> =>
  typeof (v as any)?.then === "function"
