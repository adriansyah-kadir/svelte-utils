import type { Attachment } from "svelte/attachments";
import type { MaybeGetter } from "./types";
/**
  query element in attached node using MutationObserver childList
**/
export declare function querySelector(selectors: MaybeGetter<string>, attachToDocument?: boolean): {
    element: Element | null;
    attach: () => Attachment<ParentNode>;
};
