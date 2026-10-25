export function pick<T extends object, const K extends readonly (keyof T)[]>(
  obj: T,
  keys: K,
): Pick<T, K[number]> {
  const result = {} as Pick<T, K[number]>

  for (const key of keys) {
    result[key] = obj[key]
  }

  return result
}

export function omit<T extends object, const K extends readonly (keyof T)[]>(
  obj: T,
  keys: K,
): Omit<T, K[number]> {
  const result = { ...obj }

  for (const key of keys) {
    delete result[key]
  }

  return result
}

type Coalesced<P, C> = {
  [K in keyof P | keyof C]: K extends keyof P
    ? K extends keyof C
      ? undefined extends P[K]
        ? NonNullable<P[K]> | C[K] // primary may be missing, fall back to C
        : P[K]                     // primary is always set, it always wins
      : P[K]
    : K extends keyof C
      ? C[K]
      : never;
};

/** For each key, use `primary`'s value unless it is null/undefined, else `fallback`'s. */
export function coalesce<P extends Record<string, any>, C extends Record<string, any>>(
  primary: P | undefined,
  fallback: C,
): Coalesced<NonNullable<P>, C> {
  const result: Record<string, unknown> = { ...fallback };
  if (primary) {
    for (const key of Object.keys(primary)) {
      const v = (primary as Record<string, unknown>)[key];
      if (v != null) result[key] = v;
    }
  }
  return result as Coalesced<NonNullable<P>, C>;
}
