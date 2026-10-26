import { isPromise } from "./checks";
export const noop = () => { };
export const catcher = (f, c = noop, ...a) => {
    try {
        const o = f(...a);
        return (isPromise(o) ? o.catch(c) : o);
    }
    catch (e) {
        return c(e);
    }
};
