import { untrack } from "svelte";
import { deepEqual } from "./checks";
function runEffect(flush, effect) {
    switch (flush) {
        case "post":
            $effect(effect);
            break;
        case "pre":
            $effect.pre(effect);
            break;
    }
}
function createWatch(schedule, deps, callback, opts = {}) {
    // Keeps array identity stable when its items didn't change, so
    // `() => [a, b]` doesn't count as "changed" on every re-evaluation.
    let last;
    const current = $derived.by(() => {
        const next = $state.snapshot(deps());
        if (deepEqual(next, last)) {
            return last;
        }
        return (last = next);
    });
    let first = true;
    let previous;
    schedule(() => {
        const value = current; // the only tracked read
        const isFirst = first;
        const prev = previous;
        first = false;
        previous = value;
        if (isFirst && opts.lazy)
            return;
        return untrack(() => callback(value, prev));
    });
}
export function watch(deps, callback, opts) {
    createWatch((fn) => runEffect("post", fn), deps, callback, opts);
}
/** Same as `watch`, but runs before DOM updates (`$effect.pre`). */
export function watchPre(deps, callback, opts) {
    createWatch((fn) => runEffect("pre", fn), deps, callback, opts);
}
