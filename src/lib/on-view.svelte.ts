// onView.svelte.ts  (or onView.ts)
import type { Attachment } from 'svelte/attachments';

export interface OnViewOptions extends IntersectionObserverInit {
  /** Only observe / call the callback when true. Default: true */
  enabled?: boolean;
  /** Disconnect after the first intersection. Default: true */
  once?: boolean;
}

export function onView(
  callback: (node: Element) => void,
  options: OnViewOptions = {}
): Attachment<Element> {
  const { enabled = true, once = true, ...observerOptions } = options;

  return (node) => {
    if (!enabled) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callback(entry.target);
        if (once) observer.disconnect();
      }
    }, observerOptions);

    observer.observe(node);

    return () => observer.disconnect();
  };
}
