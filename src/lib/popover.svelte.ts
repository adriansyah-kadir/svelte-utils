import type { Attachment } from "svelte/attachments"

function toggler(node: HTMLElement) {
  return function(this: PopoverState, force?: boolean, anchor?: HTMLElement) {
    const shouldOpen = force ?? !this.open
    const isOpen = node.matches(":popover-open")
    if (shouldOpen === isOpen) return;
    if (shouldOpen) node.showPopover({ source: anchor ?? this.anchor ?? undefined })
    else node.hidePopover();
  }
}

export class PopoverState {
  #node = $state<HTMLElement | null>(null)
  get node() { return this.#node }
  get nodeId() {
    const node = this.node
    if (!node) return;
    if (node.id === '') node.id = crypto.randomUUID();
    return node.id
  }

  anchor = $state<HTMLElement | null>(null)
  get anchorId() {
    const source = this.anchor;
    if (!source) return;
    if (source.id === '') source.id = crypto.randomUUID();
    return source.id
  }

  open = $state(false)

  toggle = $derived(this.node ? toggler(this.node) : undefined)
  show = $derived(this.toggle?.bind(this, true))
  hide = $derived(this.toggle?.bind(this, false, undefined))

  #transitioning = $state(false)

  constructor() {
    $effect(() => {
      const node = this.node
      if (this.#transitioning || !node || this.open === node.matches(":popover-open")) return;
      this.toggle?.(this.open)
    })
  }

  /**
    attach use node.closest("[popover]") to get the popover element
    so u can use it in child element
  **/
  attach(): Attachment<HTMLElement> {
    return node => {
      const popover = node.closest("[popover]") as HTMLElement | null
      if (!popover) return
      this.#node = popover
      popover.addEventListener("beforetoggle", this.#onBeforeToggle)
      popover.addEventListener("toggle", this.#onToggle)
      return () => {
        this.#node = null
        popover.removeEventListener("beforetoggle", this.#onBeforeToggle)
        popover.removeEventListener("toggle", this.#onToggle)
      }
    }
  }

  #onBeforeToggle = (ev: ToggleEvent) => {
    this.#transitioning = true
    this.anchor = (ev.source as HTMLElement | null) ?? this.anchor
    this.open = ev.newState === "open"
  }

  #onToggle = () => {
    this.#transitioning = false
  }
}

export function getPopoverArea(popover: PopoverState) {
  let area = $state<string>()
  let frame = 0

  function update(node: HTMLElement) {
    if (!popover.open) {
      cancelAnimationFrame(frame)
      return
    };

    area = getComputedStyle(node).positionArea
    requestAnimationFrame(update.bind(null, node))
  }

  $effect(() => {
    const node = popover.node
    const open = popover.open
    if (!node || !open) { return };
    frame = requestAnimationFrame(update.bind(null, node))
  })

  return {
    get current() { return area }
  }
}
