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
