import type { Attachment } from 'svelte/attachments';
import type { Fn } from './types';
export declare function onView<E extends Element>(callback: Fn<any, [IntersectionObserverEntry, E, IntersectionObserver]>, options?: IntersectionObserverInit & {
    enabled?: boolean;
}): Attachment<E>;
export declare function inView<E extends Element>(options?: IntersectionObserverInit): {
    readonly current: boolean;
    attach: Attachment<E>;
};
