import { onDestroy } from "svelte";
import { isPromise } from "./checks";
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
export function useResource(fetch) {
    let latestId = 0;
    let fetching = $state(false);
    let value = $state();
    let error = $state();
    let success = $state();
    const invalidate = () => ++latestId;
    const isCurrent = (id) => id === latestId;
    function succeed(id, result) {
        if (!isCurrent(id))
            return;
        value = result;
        error = undefined;
        success = true;
        fetching = false;
    }
    function fail(id, e) {
        if (!isCurrent(id))
            return;
        error = e;
        success = false;
        fetching = false;
    }
    /** Marks the request as in flight and settles state when it finishes. */
    function track(id, promise) {
        if (isCurrent(id))
            fetching = true;
        return promise.then((result) => {
            succeed(id, result);
            return result;
        }, (e) => {
            fail(id, e);
            return e;
        });
    }
    function refetch(...args) {
        const id = invalidate();
        try {
            const out = fetch(...args);
            if (!isPromise(out)) {
                succeed(id, out); // sync: state is set before this function returns
            }
            else
                track(id, out);
            return out;
        }
        catch (e) {
            fail(id, e); // sync throw
            throw e;
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
    return {
        get fetching() { return fetching; },
        get value() { return value; },
        get error() { return error; },
        success() { return success === true; },
        failed() { return success === false; },
        refetch,
        reset,
    };
}
