import { type Box, type Getter } from ".";
export type PaginationOpts = {
    page?: Box<number>;
    pageSize?: Getter<number>;
    total?: Getter<number>;
};
export declare class PaginationState {
    #private;
    readonly pageSize: number;
    readonly total: number;
    constructor(props?: PaginationOpts);
    get totalPages(): number;
    set page(value: number);
    get page(): number;
    get offset(): number;
    get start(): number;
    get end(): number;
    get hasPrevious(): boolean;
    get hasNext(): boolean;
    goTo: (page: number) => void;
    next: () => void;
    previous: () => void;
    reset: () => void;
}
