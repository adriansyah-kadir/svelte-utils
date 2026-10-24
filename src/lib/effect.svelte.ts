import { untrack } from "svelte";
import type { Fn } from "./types";
import { deepEqual } from "./checks";

type Cleanup = Fn | void;

export type WatchOpts = {
  /** Skip the initial run; only fire when deps change afterwards. */
  lazy?: boolean;
};

function runEffect(flush: "post" | "pre", effect: () => void | VoidFunction): void {
  switch (flush) {
    case "post":
      $effect(effect);
      break;
    case "pre":
      $effect.pre(effect);
      break;
  }
}

function createWatch<T>(
  schedule: (fn: () => Cleanup) => void,
  deps: () => T,
  callback: (current: T, previous: T | undefined) => Cleanup,
  opts: WatchOpts = {},
) {
  // Keeps array identity stable when its items didn't change, so
  // `() => [a, b]` doesn't count as "changed" on every re-evaluation.
  let last: T | undefined;

  const current = $derived.by(() => {
    const next = $state.snapshot(deps()) as T;
    if (deepEqual(next, last)) {
      return last as T;
    }
    return (last = next);
  });

  let first = true;
  let previous: T | undefined;

  schedule(() => {
    const value = current; // the only tracked read
    const isFirst = first;
    const prev = previous;
    first = false;
    previous = value;

    if (isFirst && opts.lazy) return;
    return untrack(() => callback(value, prev));
  });
}

export function watch<T>(
  deps: () => T,
  callback: (current: T, previous: T | undefined) => Cleanup,
  opts?: { lazy?: false },
): void;
export function watch<T>(
  deps: () => T,
  callback: (current: T, previous: T) => Cleanup,
  opts: { lazy: true },
): void;
export function watch<T>(deps: () => T, callback: (c: T, p: any) => Cleanup, opts?: WatchOpts) {
  createWatch((fn) => runEffect("post", fn), deps, callback, opts);
}

/** Same as `watch`, but runs before DOM updates (`$effect.pre`). */
export function watchPre<T>(deps: () => T, callback: (c: T, p: T | undefined) => Cleanup, opts?: WatchOpts) {
  createWatch((fn) => runEffect("pre", fn), deps, callback, opts);
}
