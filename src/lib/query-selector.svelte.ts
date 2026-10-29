import type { Attachment } from "svelte/attachments";
import type { MaybeGetter } from "./types";
import { extract } from "./extract.svelte";
import { browser } from "$app/env";

/**
  query element in attached node using MutationObserver childList
**/
export function querySelector(
  selector: MaybeGetter<string>,
  target?: MaybeGetter<Node>
): {
  element: Element | null;
  attach: () => Attachment<ParentNode>;
} {
  let element = $state<Element | null>(null);
  const q = $derived(extract(selector))
  const t = $derived.by(() => {
    const d = browser ? document : undefined
    if (target) return extract(target, d);
    return d
  })

  const attach = (): Attachment<ParentNode> => {
    return node => {
      if (!t) return;
      const query = () => {
        element = node.querySelector(q);
      };

      query();

      const observer = new MutationObserver(query);

      observer.observe(t, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }

  return {
    get element() {
      return element;
    },
    attach
  };
}
