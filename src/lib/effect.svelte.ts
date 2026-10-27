import { untrack } from "svelte";
import type { Fn } from "./types";
import { deepEqual } from "./checks";

type Cleanup = Fn | void;
type Effected = Fn<[], Cleanup>

export type WatchOpts = {
  /** Skip the initial run; only fire when deps change afterwards. */
  lazy?: boolean;
};

function _effect(flush: "post" | "pre", fn: Effected): void {
  switch (flush) {
    case "post":
      $effect(fn);
      break;
    case "pre":
      $effect.pre(fn);
      break;
  }
}

function _create<T>(
  schedule: Fn<[Effected]>,
  deps: Fn<[], T>,
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

function _watch<T>(deps: () => T, callback: (c: T, p: any) => Cleanup, opts?: WatchOpts) {
  _create((fn) => _effect("post", fn), deps, callback, opts);
}

function _watchPre<T>(deps: () => T, callback: (c: T, p: T | undefined) => Cleanup, opts?: WatchOpts) {
  _create((fn) => _effect("pre", fn), deps, callback, opts);
}

export const watch = Object.assign(_watch, {
  pre: _watchPre
})
