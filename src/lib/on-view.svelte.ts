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

    let clear: Fn | undefined;
    let visible = false;

    const run = () => {
      const fn = clear;
      clear = undefined;
      fn?.();
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (visible) continue;
          visible = true;
          clear = callback(entry.target);
          if (once) observer.disconnect();
        } else if (visible) {
          visible = false;
          run();
        }
      }
    }, observerOptions);

    observer.observe(node);

    return () => {
      observer.disconnect();
      run();
    };
  };
}
