import { type GotoOptions } from "$app/navigation";
import { type ReadonlyURLSearchParams } from "$app/state";
type Parser<T> = {
    decode: (search: ReadonlyURLSearchParams) => T;
    encode?: (value: T) => URLSearchParams;
} | ((search: ReadonlyURLSearchParams) => T);
export declare function useSearchParams<T>(parser: Parser<T>, opts?: GotoOptions & {
    enabled?: boolean;
}): {
    current: T;
    clear(): void;
};
export {};
