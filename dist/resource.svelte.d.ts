import type { Fn } from "./types";
type AnyFn = Fn<any, any>;
export interface Resource<F extends AnyFn, E = unknown> {
    readonly fetching: boolean;
    readonly value: Awaited<ReturnType<F>> | undefined;
    readonly error: E | undefined;
    success(): this is {
        readonly value: Awaited<ReturnType<F>>;
    };
    failed(): this is {
        readonly error: E;
    };
    refetch(...args: Parameters<F>): ReturnType<F>;
    reset(): void;
}
/**
 * Reactive wrapper around a sync or async function.
 *
 * - Sync functions settle immediately, so `value`/`error` are populated during
 *   SSR and on first client render. `fetching` never becomes true.
 * - Async functions settle later. With `initial`, the call starts at init but is
 *   only tracked from `onMount`, so SSR output and hydration stay identical.
 *
 * Concurrency model: "latest call wins". Every call gets an incrementing id and
 * only the current id may write state. A superseded call still resolves or
 * rejects for its own caller.
 *
 * Must be called during component initialisation.
 */
export declare function useResource<F extends AnyFn, E = unknown>(fetch: F): Resource<F>;
export {};
