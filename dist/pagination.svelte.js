import { box } from ".";
export class PaginationState {
    #page;
    pageSize;
    total;
    constructor(props) {
        this.#page = props?.page ?? box(1);
        this.pageSize = $derived(props?.pageSize?.() ?? 10);
        this.total = $derived(props?.total?.() ?? Infinity);
    }
    get totalPages() {
        return Number.isFinite(this.total) ? Math.max(1, Math.ceil(this.total / this.pageSize)) : Infinity;
    }
    set page(value) {
        this.#page.current = Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1;
    }
    get page() {
        const max = this.totalPages;
        return Math.min(this.#page.current, max);
    }
    get offset() { return (this.page - 1) * this.pageSize; }
    get start() {
        return this.total === 0 ? 0 : this.offset + 1;
    }
    get end() {
        const end = this.offset + this.pageSize;
        return Math.min(end, this.total);
    }
    get hasPrevious() { return this.page > 1; }
    get hasNext() { return this.page < this.totalPages; }
    goTo = (page) => { this.page = page; };
    next = () => { if (this.hasNext)
        this.page = this.page + 1; };
    previous = () => { if (this.hasPrevious)
        this.page = this.page - 1; };
    reset = () => { this.page = 1; };
}
