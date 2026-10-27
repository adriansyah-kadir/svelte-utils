import type { Attachment } from "svelte/attachments"
import type { Fn } from "./types"

type Mut<N extends Node> = MutationRecord & { target: N }

export function observeMutation<N extends Node>(cb: Fn<[Mut<N>]>, opts?: MutationObserverInit): Attachment<N> {
  const observer = new MutationObserver(mutations => {
    for (const mut of mutations) {
      cb(mut as Mut<N>)
    }
  })

  return (node: N) => {
    observer.observe(node, opts)
    return () => observer.disconnect()
  }
}

type ResizeEntry<E extends Element> = ResizeObserverEntry & { target: E }

export function observeResize<E extends Element>(cb: Fn<[ResizeEntry<E>]>, opts?: ResizeObserverOptions): Attachment<E> {
  return (node: E) => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        cb(entry as ResizeEntry<E>)
      }
    })

    observer.observe(node, opts)
    return () => observer.disconnect()
  }
}

type IntersectEntry<E extends Element> = IntersectionObserverEntry & { target: E }

export function observeIntersection<E extends Element>(cb: Fn<[IntersectEntry<E>]>, opts?: IntersectionObserverInit): Attachment<E> {
  return (node: E) => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        cb(entry as IntersectEntry<E>)
      }
    }, opts)

    observer.observe(node)
    return () => observer.disconnect()
  }
}
