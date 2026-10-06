import type { Attachment } from "svelte/attachments"
import type { StandardSchemaV1 as Std } from "./standard-schema"
import { noop } from "."

export class ValidationError extends Error {
  constructor(readonly issues: readonly Std.Issue[]) { super("Validation failed") }

  static is(error: unknown): error is ValidationError {
    return error instanceof ValidationError
  }
}

/** Validate input against any Standard Schema, then run the action with the parsed output. */
export const validated = <S extends Std<any, any>, R>(
  schema: S,
  action: (output: Std.InferOutput<S>) => Promise<R>,
) => async (input: unknown): Promise<R> => {
  const res = await schema["~standard"].validate(input)
  if (res.issues) throw new ValidationError(res.issues)
  return action(res.value)
}

type Values = Record<string, FormDataEntryValue | FormDataEntryValue[] | null>

/** Read a form into a plain object. Multi-value fields use getAll. */
export function readForm(form: HTMLFormElement, arrays: string[] = []): Values {
  const data = new FormData(form)
  const names = new Set([...arrays, ...data.keys()])
  return Object.fromEntries([...names].map(n => [n, arrays.includes(n) ? data.getAll(n) : data.get(n)]))
}

/** On submit: prevent the default, read the form, and pass the values to `onValues`. */
export function formValues(
  onValues: (values: Values) => unknown,
  arrays: string[] = [],
): Attachment<HTMLFormElement> {
  return (form) => {
    const onsubmit = (e: SubmitEvent) => {
      e.preventDefault()
      const result = onValues(readForm(form, arrays))
      // Failures are already captured in useResource state; avoid an unhandled rejection.
      if (result instanceof Promise) result.catch(noop)
    }
    form.addEventListener("submit", onsubmit)
    return () => form.removeEventListener("submit", onsubmit)
  }
}
/** Group an error's issues by top-level field. Non-validation errors give no issues. */
type AnySchema = Std<any, any>
type Keys<S extends AnySchema> = Extract<keyof Std.InferInput<S>, string>

/** Field names from the schema, plus "" for root-level issues. Only fields with issues are present. */
export type FieldIssues<S extends AnySchema = AnySchema> =
  Partial<Record<Keys<S> | "", Std.Issue[]>>

export function fieldIssues<S extends AnySchema>(error: unknown, _schema?: S): FieldIssues<S> {
  const grouped: Record<string, Std.Issue[]> = {}
  if (!(error instanceof ValidationError)) return grouped as FieldIssues<S>
  for (const issue of error.issues) {
    const seg = issue.path?.[0]
    const key = seg === undefined ? "" : String(typeof seg === "object" ? seg.key : seg)
      ; (grouped[key] ??= []).push(issue)
  }
  return grouped as FieldIssues<S>
}
