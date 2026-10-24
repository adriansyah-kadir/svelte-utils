export function observeMutation(cb, opts) {
    const observer = new MutationObserver(mutations => {
        for (const mut of mutations) {
            cb(mut);
        }
    });
    return (node) => {
        observer.observe(node, opts);
        return () => observer.disconnect();
    };
}
