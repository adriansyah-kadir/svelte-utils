import type { Fn } from "./types";
export declare const noop: () => void;
type Handler = Fn<any, [unknown]>;
type DefaultHandler = Fn<void, [unknown]>;
/** Return type: promises stay promises, sync results stay sync. Distributes over unions. */
type Caught<R, H extends Handler> = R extends PromiseLike<infer V> ? Promise<V | Awaited<ReturnType<H>>> : R | ReturnType<H>;
export declare const catcher: <F extends Fn<any, any>, C extends Handler = DefaultHandler>(f: F, c?: C, ...a: Parameters<F>) => Caught<ReturnType<F>, C>;
export {};
