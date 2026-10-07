import { toStore } from "svelte/store";
export function stateChange(get, predicate) {
    const store = toStore(get);
    const { promise, resolve } = Promise.withResolvers();
    const unsubscribe = store.subscribe(value => {
        if (predicate(value))
            resolve(value);
    });
    promise.then(() => unsubscribe());
    return promise;
}
