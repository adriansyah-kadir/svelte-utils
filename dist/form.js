import { noop } from ".";
export class ValidationError extends Error {
    issues;
    constructor(issues) {
        super("Validation failed");
        this.issues = issues;
    }
    static is(error) {
        return error instanceof ValidationError;
    }
}
/** Validate input against any Standard Schema, then run the action with the parsed output. */
export const validated = (schema, action) => async (input) => {
    const res = await schema["~standard"].validate(input);
    if (res.issues)
        throw new ValidationError(res.issues);
    return action(res.value);
};
/** Read a form into a plain object. Multi-value fields use getAll. */
export function readForm(form, arrays = []) {
    const data = new FormData(form);
    const names = new Set([...arrays, ...data.keys()]);
    return Object.fromEntries([...names].map(n => [n, arrays.includes(n) ? data.getAll(n) : data.get(n)]));
}
/** On submit: prevent the default, read the form, and pass the values to `onValues`. */
export function formValues(onValues, arrays = []) {
    return (form) => {
        const onsubmit = (e) => {
            e.preventDefault();
            const result = onValues(readForm(form, arrays));
            // Failures are already captured in useResource state; avoid an unhandled rejection.
            if (result instanceof Promise)
                result.catch(noop);
        };
        form.addEventListener("submit", onsubmit);
        return () => form.removeEventListener("submit", onsubmit);
    };
}
export function fieldIssues(error, _schema) {
    const grouped = {};
    if (!(error instanceof ValidationError))
        return grouped;
    for (const issue of error.issues) {
        const seg = issue.path?.[0];
        const key = seg === undefined ? "" : String(typeof seg === "object" ? seg.key : seg);
        (grouped[key] ??= []).push(issue);
    }
    return grouped;
}
