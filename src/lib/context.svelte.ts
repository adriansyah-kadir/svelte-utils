import type { Constructor } from "#lib";
import { getContext, hasContext, setContext } from "svelte";

const keys = new WeakMap<Function, symbol>();
function getContextKey(ctor: Function) {
  let key = keys.get(ctor);

  if (!key) {
    key = Symbol();
    keys.set(ctor, key);
  }

  return key;
}

export abstract class Context {
  static exists() {
    return hasContext(getContextKey(this))
  }

  static get<C extends Constructor<Context>>(this: C): InstanceType<C> {
    return getContext<InstanceType<C>>(getContextKey(this));
  }

  static getOr<C extends Constructor<Context>>(this: C): InstanceType<C> | undefined
  static getOr<C extends Constructor<Context>>(this: C, args: ConstructorParameters<C>): InstanceType<C>
  static getOr<C extends Constructor<Context>>(
    this: C,
    args?: ConstructorParameters<C>
  ): InstanceType<C> | undefined {
    const key = getContextKey(this);
    if (hasContext(key)) return getContext(key);
    return args !== undefined
      ? setContext(key, new this(...args) as InstanceType<C>)
      : undefined
  }

  constructor() {
    setContext(
      getContextKey(this.constructor),
      this,
    );
  }
}
