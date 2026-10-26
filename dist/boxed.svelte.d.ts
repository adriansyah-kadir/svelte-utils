import { type Getter, type Setter } from ".";
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
export declare function boxFlat<T>(outer: Box<T>, deep?: boolean): T;
export declare function boxArray<T>(b: Box<T[]>): T[];
export declare function boxLink<T>(own: Box<T>, other: Box<T>): void;
