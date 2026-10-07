import type { Fn } from ".";
type AsyncFn = Fn<Promise<any>, any>;
type Result<F extends AsyncFn> = Awaited<ReturnType<F>>;
export interface Resource<F extends AsyncFn, E = unknown> {
    readonly fetching: boolean;
    readonly value: Result<F> | undefined;
    readonly error: E | undefined;
    success(): this is {
        value: Result<F>;
    };
    failed(): this is {
        error: E;
    };
    refetch(...args: Parameters<F>): Promise<Result<F>>;
    reset(): void;
}
/**
 * Reactive wrapper around an async function.
 *
 * Concurrency model: "latest call wins".
 * Every `refetch` gets an incrementing id. Only the call whose id is still
 * current may write to state, so a superseded call (or one that finishes after
 * `reset()` / unmount) never changes `value`, `error`, `success` or `fetching`.
 * A superseded call still resolves/rejects for its own caller.
 *
 * @param fetch   The async function to wrap.
 * @param initial Arguments for an automatic fetch on mount. Omit to skip.
 *
 * Must be called during component initialisation (uses `onMount`).
 */
export declare function useResource<F extends AsyncFn, E = unknown>(fetch: F, initial?: Parameters<F>): Resource<F, E>;
export {};
