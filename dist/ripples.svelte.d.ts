import type { Attachment } from "svelte/attachments";
export type RippleOptions = {
    color?: string;
    /** Full animation length in ms at normal speed. */
    duration?: number;
    opacity?: number;
    /** Ripple diameter relative to the element's largest side. */
    scale?: number;
    /** Playback rate while the pointer is held. */
    holdSpeed?: number;
};
export declare function useRipples(options?: RippleOptions): Attachment<HTMLElement>;
