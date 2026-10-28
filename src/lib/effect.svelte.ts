import { untrack } from "svelte";
import type { Fn, Getter } from "./types";

type Cleanup = Fn | void;
type Callback<T> = Fn<[current: T, previous: T | undefined], Cleanup>;
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
  deps: Getter<T>,
  callback: Callback<T>,
  opts: WatchOpts = {},
) {
  const current = $derived.by(deps);

  let first = true;
  let previous: T | undefined;

  schedule(() => {
    const value = $state.snapshot(current) as T; // the only tracked read
    const isFirst = first;
    const prev = previous;
    first = false;
    previous = value;
    if (isFirst && opts.lazy) return;
    return untrack(() => callback(value, prev));
  });
}

function _watch<T>(deps: Getter<T>, callback: Callback<T>, opts?: WatchOpts) {
  _create((fn) => _effect("post", fn), deps, callback, opts);
}

function _watchPre<T>(deps: () => T, callback: Callback<T>, opts?: WatchOpts) {
  _create((fn) => _effect("pre", fn), deps, callback, opts);
}

export const watch = Object.assign(_watch, {
  pre: _watchPre
})
