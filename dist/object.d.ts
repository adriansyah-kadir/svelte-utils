export declare function pick<T extends object, const K extends readonly (keyof T)[]>(obj: T, keys: K): Pick<T, K[number]>;
export declare function omit<T extends object, const K extends readonly (keyof T)[]>(obj: T, keys: K): Omit<T, K[number]>;
type Coalesced<P, C> = {
    [K in keyof P | keyof C]: K extends keyof P ? K extends keyof C ? undefined extends P[K] ? NonNullable<P[K]> | C[K] : P[K] : P[K] : K extends keyof C ? C[K] : never;
};
/** For each key, use `primary`'s value unless it is null/undefined, else `fallback`'s. */
export declare function coalesce<P extends Record<string, any>, C extends Record<string, any>>(primary: P | undefined, fallback: C): Coalesced<NonNullable<P>, C>;
export {};
