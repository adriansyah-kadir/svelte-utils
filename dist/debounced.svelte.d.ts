import type { Getter } from "./types";
export declare function debounced<T>(getter: Getter<T>, timeout?: number): import("./boxed.svelte").Box<T>;
