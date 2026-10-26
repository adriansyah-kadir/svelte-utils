import type { Fn } from "./types";
type Cleanup = Fn | void;
export type WatchOpts = {
    /** Skip the initial run; only fire when deps change afterwards. */
    lazy?: boolean;
};
export declare function watch<T>(deps: () => T, callback: (current: T, previous: T | undefined) => Cleanup, opts?: {
    lazy?: false;
}): void;
export declare function watch<T>(deps: () => T, callback: (current: T, previous: T) => Cleanup, opts: {
    lazy: true;
}): void;
/** Same as `watch`, but runs before DOM updates (`$effect.pre`). */
export declare function watchPre<T>(deps: () => T, callback: (c: T, p: T | undefined) => Cleanup, opts?: WatchOpts): void;
export {};
