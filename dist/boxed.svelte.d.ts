import type { Getter, Setter } from ".";
export type Box<T> = {
    current: T;
};
export declare function boxState<T>(initial: T, setter?: Setter<T, T>): {
    current: T;
};
export declare function boxDerived<T>(getter: Getter<T>, setter?: Setter<T>): {
    current: T;
};
export declare function box<T>(getterOrInitial: Getter<T> | T, setter?: Setter<T>): Box<T>;
