export function onView(callback, options = {}) {
    const { enabled = true, ...observerOptions } = options;
    return (node) => {
        if (!enabled)
            return;
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                callback(entry, node, observer);
            }
        }, observerOptions);
        observer.observe(node);
        return () => observer.disconnect();
    };
}
export function inView(options) {
    let current = $state(false);
    const attach = (node) => {
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
