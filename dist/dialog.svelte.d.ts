import type { Attachment } from "svelte/attachments";
export declare class DialogState {
    #private;
    open: boolean;
    closed: boolean;
    node: HTMLDialogElement | undefined;
    toggle: ((this: DialogState, force?: boolean) => void) | undefined;
    close: (() => void) | undefined;
    show: (() => void) | undefined;
    constructor();
    get nodeId(): string | undefined;
    /**
      attach use node.closest("dialog") to get the dialog element
      so u can use it in dialog child element
    **/
    attach(): Attachment;
}
