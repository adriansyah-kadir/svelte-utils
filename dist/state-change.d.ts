export declare function stateChange<T, R extends T>(get: () => T, predicate: (value: T) => value is R): Promise<R>;
export declare function stateChange<T>(get: () => T, predicate: (value: T) => boolean): Promise<T>;
