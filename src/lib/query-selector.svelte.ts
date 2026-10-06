import type { Attachment } from "svelte/attachments";
import type { MaybeGetter } from "./types";
import { extract } from "./extract.svelte";
import { onMount } from "svelte";

/**
  query element in attached node using MutationObserver childList
**/
export function querySelector(
  selectors: MaybeGetter<string>,
  attachToDocument: boolean = true
): {
  element: Element | null;
  attach: () => Attachment<ParentNode>;
} {
  let element = $state<Element | null>(null);
  const q = $derived(extract(selectors))

  const attach = (): Attachment<ParentNode> => {
    return node => {
      const query = () => {
        element = node.querySelector(q);
      };

      query();

      const observer = new MutationObserver(query);

      observer.observe(node, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }

  onMount(() => {
    if (attachToDocument) return attach()(document)
  })

  return {
    get element() {
      return element;
    },
    attach
  };
}
