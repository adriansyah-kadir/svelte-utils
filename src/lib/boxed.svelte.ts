import { dequal } from "dequal";
import { watch, type Getter, type MaybeGetter, type Setter } from "."

export type Box<T> = { current: T }

function _state<T>(
  initial: T,
  setter: Setter<T, T> = t => t
) {
  let current = $state(initial)
  return {
    get current() { return current },
    set current(value: T) { current = setter(value) }
  }
}

function _derived<T>(
  getter: Getter<T>,
  setter?: Setter<T>
) {
  const current = $derived.by(getter)
  return {
    get current() { return current },
    set current(value: T) { setter?.(value) }
  }
}

function _box<T>(
  getterOrInitial: MaybeGetter<T>,
  setter?: Setter<T>
): Box<T> {
  return typeof getterOrInitial === "function"
    ? _derived(getterOrInitial as Getter<T>, setter)
    : _state(getterOrInitial, setter)
}

function _link<T>(own: Box<T>, other: Box<T>) {
  watch(() => own.current, (v) => {
    if (!dequal(v, other.current)) other.current = v;
  });
  watch(() => other.current, (v) => {
    if (!dequal(v, own.current)) own.current = v;
  });
}

function _child<T extends object, K extends keyof T>(
  parent: Box<T>,
  key: K
) {
  const current = $derived(parent.current[key])
  return {
    get current() { return current },
    set current(value) {
      const cur = parent.current
      if (Array.isArray(cur)) {
        parent.current = cur.with(key as number, value) as T
      } else {
        parent.current = { ...cur, [key]: value }
      }
    },
    delete() {
      const cur = parent.current
      if (Array.isArray(cur)) {
        parent.current = cur.toSpliced(key as number, 1) as T
      } else {
        const { [key]: _, ...rest } = cur
        parent.current = rest as T
      }
    },
  }
}

export const box = Object.assign(_box, {
  state: _state,
  derived: _derived,
  link: _link,
  child: _child
})
