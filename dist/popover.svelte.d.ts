import { type Box, type Getter } from ".";
import type { Attachment } from "svelte/attachments";
export type PopoverOpts = {
    open?: Box<boolean>;
    fallbackAnchor?: Getter<HTMLElement | undefined>;
};
export declare class PopoverState {
    #private;
    get open(): boolean;
    set open(value: boolean);
    get anchor(): HTMLElement | undefined;
    get anchorId(): string | undefined;
    get node(): HTMLElement | undefined;
    get nodeId(): string | undefined;
    toggle: (this: PopoverState, force?: boolean, anchor?: HTMLElement) => void;
    show: (anchor?: HTMLElement | undefined) => void;
    hide: () => void;
    constructor(opts?: PopoverOpts);
    /**
      attach use node.closest("[popover]") to get the popover element
      so u can use it in child element
    **/
    attach(): Attachment<HTMLElement>;
}
export declare function getPopoverArea(popover: PopoverState): {
    readonly current: string | undefined;
};
