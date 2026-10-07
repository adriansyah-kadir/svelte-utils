import { onDestroy, onMount } from "svelte";
const noop = () => { };
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
export function useResource(fetch, initial) {
    let latestId = 0;
    // ── Reactive state ──────────────────────────────────────────
    let fetching = $state(false);
    let value = $state();
    let error = $state();
    let success = $state();
    /** Bump the id so every older in-flight request becomes stale. Returns the new id. */
    const invalidate = () => ++latestId;
    const isCurrent = (id) => id === latestId;
    async function refetch(...args) {
        const id = invalidate(); // supersedes any previous request
        fetching = true;
        try {
            const result = await fetch(...args);
            if (isCurrent(id)) {
                value = result;
                error = undefined;
                success = true;
            }
            return result;
        }
        catch (e) {
            if (isCurrent(id)) {
                error = e;
                success = false;
            }
            throw e;
        }
        finally {
            if (isCurrent(id))
                fetching = false;
        }
    }
    function reset() {
        invalidate();
        value = undefined;
        error = undefined;
        success = undefined;
        fetching = false;
    }
    onDestroy(invalidate);
    onMount(() => {
        if (initial !== undefined)
            refetch(...initial).catch(noop);
    });
    return {
        get fetching() { return fetching; },
        get value() { return value; },
        get error() { return error; },
        // ── Type guards ───────────────────────────────────────────
        success() {
            return success === true;
        },
        failed() {
            return success === false;
        },
        refetch,
        reset,
    };
}
