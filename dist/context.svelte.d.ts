import type { Constructor } from ".";
export declare abstract class Context {
    static exists(): boolean;
    static get<C extends Constructor<Context>>(this: C): InstanceType<C>;
    static getOr<C extends Constructor<Context>>(this: C): InstanceType<C> | undefined;
    static getOr<C extends Constructor<Context>>(this: C, args: ConstructorParameters<C>): InstanceType<C>;
    constructor();
}
