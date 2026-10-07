function toggler(dialog) {
    return function (force) {
        const shouldShow = force ?? !this.open;
        if (shouldShow)
            dialog.showModal();
        else
            dialog.close();
    };
}
export class DialogState {
    open = $state(false);
    closed = $derived(!this.open);
    node = $state();
    toggle = $derived(this.node ? toggler(this.node) : undefined);
    close = $derived(this.toggle?.bind(this, false));
    show = $derived(this.toggle?.bind(this, true));
    constructor() {
        $effect(() => {
            const node = this.node;
            if (!node || this.open === node.open)
                return;
            this.toggle?.(this.open);
        });
    }
    get nodeId() {
        if (!this.node)
            return;
        if (this.node.id.trim() === "")
            this.node.id = crypto.randomUUID();
        return this.node.id;
    }
    /**
      attach use node.closest("dialog") to get the dialog element
      so u can use it in dialog child element
    **/
    attach() {
        return (node) => {
            const dialog = node.closest("dialog");
            if (!dialog)
                return;
            return this.#setup(dialog);
        };
    }
    #setup(dialog) {
        this.node = dialog;
        dialog.addEventListener("beforetoggle", this.#onToggle);
        return () => {
            this.node = undefined;
            dialog.removeEventListener("beforetoggle", this.#onToggle);
        };
    }
    #onToggle = (event) => {
        console.log(event.newState);
        this.open = event.newState === "open";
    };
}
