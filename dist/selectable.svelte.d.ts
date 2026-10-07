import type { Getter } from "./types";
export type SelectableOpts<T> = {
    initialOptions?: [string, T][];
    initialSelected?: string[];
    multiple?: Getter<boolean>;
};
export declare class Selectable<T> {
    #private;
    multiple: boolean;
    constructor(opts?: SelectableOpts<T>);
    get all(): [string, T][];
    get selected(): [string, T][];
    get isAllSelected(): boolean;
    clearOptions: () => void;
    clearSelection: () => void;
    register: (id: string, value: T) => () => void;
    remove: (id: string) => void;
    hasOption: (id: string) => boolean;
    isSelected: (id: string) => boolean;
    select: (id: string) => boolean;
    deselect: (id: string) => boolean;
    toggle: (id: string, force?: boolean) => boolean;
    toggleAll: (force?: boolean) => boolean | undefined;
}
