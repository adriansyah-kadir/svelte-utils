import { box, boxFlat, catcher, noop } from "#lib";
import { building } from "$app/env"; // was "$app/env"
import { goto, type GotoOptions } from "$app/navigation";
import { page } from "$app/state";
import { validated } from "./form";
import { useResource } from "./resource.svelte";
import { createStandardSchema, type StandardSchemaV1 } from "./standard-schema";

type Key = string;
type Value = string | string[] | null;
type Params = Partial<Record<Key, Value>>;
type Schema = StandardSchemaV1<Params, any>;
type DefaultSchema = StandardSchemaV1<Params, Params>;

const anySchema = createStandardSchema((value: Params) => ({ value }));

function readParams(): Params {
  const out: Params = {};
  const sp = page.url.searchParams;
  for (const k of new Set(sp.keys())) {
    const all = sp.getAll(k);
    out[k] = all.length > 1 ? all : all[0];
  }
  return out;
}

function toUrl(next: Params): string {
  const p = new URLSearchParams();
  for (const [key, val] of Object.entries(next)) {
    if (Array.isArray(val)) val.forEach(item => p.append(key, item));
    else if (typeof val === "string") p.set(key, val);
    // null / undefined => omitted
  }
  const qs = p.toString();
  return qs ? `?${qs}` : page.url.pathname;
}

/**
 * usage:
 * const {params, values} = useSearchParams(schema)
 *
 * to update params:
 * params = {...params, age: 10}
 *
 * this doesn't work:
 * params.age = 10
**/
export function useSearchParams<S extends Schema = DefaultSchema>(
  schema?: S,
  opts?: GotoOptions & { enabled?: boolean }
) {
  type In = StandardSchemaV1.InferInput<S>;
  const enabled = $derived(opts?.enabled ?? !building)

  // Reading: fine during SSR, throws only while prerendering.
  const params = box<In>(
    () => enabled ? readParams() : {},
    params => goto(toUrl(params), { reset: false, ...opts })
  );

  // Sync schemas settle at init, so `values.value` is filled on the server and
  // on first client render. Async schemas start tracking in onMount.
  const values = useResource(validated((schema ?? anySchema) as S, v => v),);
  if (enabled) catcher(values.refetch, noop, params.current);

  // Refetch on URL changes. The first run is skipped because already run
  // covered it, which avoids a duplicate validation on mount.
  let first = true;
  $effect(() => {
    const p = params.current; // read first so the effect always subscribes
    if (first) { first = false; return; }
    catcher(values.refetch, noop, p)
  });

  return {
    values,
    get params() { return boxFlat(params) },
    set params(value: In) { params.current = value }
  };
}
