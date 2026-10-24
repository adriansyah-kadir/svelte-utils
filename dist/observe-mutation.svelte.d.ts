import type { Attachment } from "svelte/attachments";
import type { Fn } from "./types";
type Mut<N extends Node> = MutationRecord & {
    target: N;
};
export declare function observeMutation<N extends Node>(cb: Fn<any, [Mut<N>]>, opts?: MutationObserverInit): Attachment<N>;
export {};
