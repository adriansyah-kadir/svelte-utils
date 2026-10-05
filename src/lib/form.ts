import type { StandardSchemaV1 as Std } from "./standard-schema"

export class ValidationError extends Error {
  constructor(readonly issues: readonly Std.Issue[]) { super("Validation failed") }
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

/** Read a form into a plain object. Multi-value fields use getAll. */
export function formValues(form: HTMLFormElement, arrays: string[] = []) {
  const data = new FormData(form)
  const names = new Set([...arrays, ...data.keys()])
  return Object.fromEntries([...names].map(n => [n, arrays.includes(n) ? data.getAll(n) : data.get(n)]))
}

/** Group an error's issues by top-level field. Non-validation errors give no issues. */
export function fieldIssues(error: unknown): Record<string, Std.Issue[]> {
  const grouped: Record<string, Std.Issue[]> = {}
  if (!(error instanceof ValidationError)) return grouped
  for (const issue of error.issues) {
    const seg = issue.path?.[0]
    const key = seg === undefined ? "" : String(typeof seg === "object" ? seg.key : seg)
    ;(grouped[key] ??= []).push(issue)
  }
  return grouped // key "" holds root-level issues
}
