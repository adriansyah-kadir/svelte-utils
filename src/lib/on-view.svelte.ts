import type { Attachment } from 'svelte/attachments';
import type { Fn } from './types';


export function onView<E extends Element>(
  callback: Fn<any, [IntersectionObserverEntry, E, IntersectionObserver]>,
  options: IntersectionObserverInit & { enabled?: boolean; } = {}
): Attachment<E> {
  const { enabled = true, ...observerOptions } = options;

  return (node) => {
    if (!enabled) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        callback(entry, node, observer);
      }
    }, observerOptions);

    observer.observe(node);

    return () => observer.disconnect();
  };
}

export function inView<E extends Element>(options?: IntersectionObserverInit) {
  let current = $state(false);

  const attach: Attachment<E> = (node) => {
    const observer = new IntersectionObserver(([entry]) => {
      current = entry.isIntersecting;
    }, options);
    observer.observe(node);
    return () => observer.disconnect();
  };

  return {
    get current() { return current; },
    attach,
  };
}
