import { getContext, hasContext, setContext } from "svelte";
const keys = new WeakMap();
function getContextKey(ctor) {
    let key = keys.get(ctor);
    if (!key) {
        key = Symbol();
        keys.set(ctor, key);
    }
    return key;
}
export class Context {
    static exists() {
        return hasContext(getContextKey(this));
    }
    static get() {
        return getContext(getContextKey(this));
    }
    static getOr(args) {
        const key = getContextKey(this);
        if (hasContext(key))
            return getContext(key);
        return args !== undefined
            ? setContext(key, new this(...args))
            : undefined;
    }
    constructor() {
        setContext(getContextKey(this.constructor), this);
    }
}
