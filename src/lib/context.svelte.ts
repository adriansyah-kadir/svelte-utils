import type { Box, Constructor } from "#lib";
import { getContext, hasContext, setContext } from "svelte";

type ContextArgs<T, C extends Constructor<Context<T>>> = ConstructorParameters<C> extends [unknown, ...infer R] ? [Box<T>, ...R] : [];;

const keys = new WeakMap<Function, symbol>();
function getContextKey(ctor: Function) {
  let key = keys.get(ctor);

  if (!key) {
    key = Symbol();
    keys.set(ctor, key);
  }

  return key;
}

export class Context<T> {
  #opts: Box<T>
  get opts() { return this.#opts.current }
  set opts(value: T) {
    this.#opts.current = value
  }

  static exists() {
    return hasContext(getContextKey(this))
  }

  static get<C extends Constructor<Context<any>>>(this: C): InstanceType<C> {
    return getContext<InstanceType<C>>(getContextKey(this));
  }

  static getOr<C extends Constructor<Context<any>, any>>(this: C): InstanceType<C> | undefined
  static getOr<T, A extends [Box<T>, ...unknown[]], C extends Constructor<Context<T>, A>>(this: C, ...args: A): InstanceType<C>

  static getOr<C extends Constructor<Context<T>>, T>(
    this: C,
    ...args: ContextArgs<T, C>
  ): InstanceType<C> | undefined {
    const key = getContextKey(this);
    const opts = args[0]
    if (!hasContext(key)) {
      if (opts === undefined) return undefined;
      return new this(...args) as InstanceType<C>
    }

    const ctx = getContext<InstanceType<C>>(key)
    if (opts !== undefined) {
      $effect(() => {
        opts.current = ctx.opts
      })
    }

    return ctx;
  }

  constructor(opts: Box<T>) {
    this.#opts = opts
    setContext(
      getContextKey(this.constructor),
      this,
    );
  }
}
