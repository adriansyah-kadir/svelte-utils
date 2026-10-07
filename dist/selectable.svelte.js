import { SvelteMap, SvelteSet } from "svelte/reactivity";
export class Selectable {
    #options;
    #selected;
    multiple;
    constructor(opts) {
        this.#options = new SvelteMap(opts?.initialOptions);
        this.#selected = new SvelteSet(opts?.initialSelected?.filter(this.hasOption));
        this.multiple = $derived(opts?.multiple?.() ?? false);
        $effect(() => {
            if (this.multiple || this.#selected.size <= 1)
                return;
            const first = this.#selected.values().next().value;
            this.#selected.clear();
            this.#selected.add(first);
        });
    }
    get all() {
        return this.#options.entries().toArray();
    }
    get selected() {
        return this.all.filter(([id]) => this.isSelected(id));
    }
    get isAllSelected() {
        return this.#options.size > 0 &&
            this.#selected.size === this.#options.size;
    }
    clearOptions = () => {
        this.#options.clear();
        this.#selected.clear();
    };
    clearSelection = () => this.#selected.clear();
    register = (id, value) => {
        this.#options.set(id, value);
        return () => this.remove(id);
    };
    remove = (id) => {
        this.#options.delete(id);
        this.#selected.delete(id);
    };
    hasOption = (id) => this.#options.has(id);
    isSelected = (id) => this.#selected.has(id);
    select = (id) => {
        if (this.isSelected(id) || !this.#options.has(id))
            return false;
        if (!this.multiple) {
            this.#selected.clear();
        }
        this.#selected.add(id);
        return true;
    };
    deselect = (id) => this.#selected.delete(id);
    toggle = (id, force) => {
        const shouldSelect = force ?? !this.isSelected(id);
        if (shouldSelect)
            this.select(id);
        else
            this.deselect(id);
        return this.isSelected(id);
    };
    toggleAll = (force) => {
        if (!this.multiple)
            return;
        const shouldSelect = force ?? !this.isAllSelected;
        if (shouldSelect) {
            for (const id of this.#options.keys()) {
                this.select(id);
            }
        }
        else {
            this.#selected.clear();
        }
        return this.isAllSelected;
    };
}
