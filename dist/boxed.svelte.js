export function boxState(initial, setter = t => t) {
    let current = $state(initial);
    return {
        get current() { return current; },
        set current(value) { current = setter(value); }
    };
}
export function boxDerived(getter, setter) {
    const current = $derived.by(getter);
    return {
        get current() { return current; },
        set current(value) { setter?.(value); }
    };
}
export function box(getterOrInitial, setter) {
    return typeof getterOrInitial === "function"
        ? boxDerived(getterOrInitial, setter)
        : boxState(getterOrInitial, setter);
}
