import type { Attachment } from "svelte/attachments"
import type { Fn } from "./types"

type Observer<E, N, O> = (cb: Fn<[E[]]>) => {
  observe: (target: N, opts?: O) => void,
  disconnect: () => void
};

function _observe<E, N extends Element, O>(
  Observer: Observer<E, N, O>,
  callback: Fn<[E]>,
  opts?: O,
): Attachment<N> {
  return node => {
    const observer = Observer(entries => {
      for (const entry of entries) callback(entry);
    })

    observer.observe(node, opts)
    return observer.disconnect
  }
}

export function observeMutation<N extends Element>(callback: Fn<[MutationRecord]>, opts?: MutationObserverInit): Attachment<N> {
  return _observe(fn => new MutationObserver(fn), callback, opts)
}

export function observeResize<N extends Element>(callback: Fn<[ResizeObserverEntry]>, opts?: ResizeObserverOptions): Attachment<N> {
  return _observe(fn => new ResizeObserver(fn), callback, opts)
}

export function observeIntersection<N extends Element>(callback: Fn<[IntersectionObserverEntry]>, opts?: IntersectionObserverInit): Attachment<N> {
  return _observe(fn => new IntersectionObserver(fn), callback, opts)
}
