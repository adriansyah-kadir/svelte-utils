import { box } from "./boxed.svelte";
export function debounced(getter, timeout = 500) {
    const value = box(getter());
    $effect(() => {
        const v = getter();
        return clearTimeout.bind(null, setTimeout(() => (value.current = v), timeout));
    });
    return value;
}
