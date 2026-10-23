import type { Attachment } from 'svelte/attachments';
import type { Fn } from './types';

export interface OnViewOptions extends IntersectionObserverInit {
  /** Only observe / call the callback when true. Default: true */
  enabled?: boolean;
  /** Disconnect after the first intersection. Default: true */
  once?: boolean;
}

export function onView(
  callback: Fn<Fn | undefined, [Element]>,
  options: OnViewOptions = {}
): Attachment<Element> {
  const { enabled = true, once = true, ...observerOptions } = options;

  return (node) => {
    if (!enabled) return;

    let clear: Fn | undefined

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          clear = callback(entry.target)
          if (!once && clear === undefined) observer.disconnect()
        }
        else {
          if (!once) observer.disconnect()
          clear?.()
        };
      }
    }, observerOptions);

    observer.observe(node);

    return () => observer.disconnect();
  };
}
