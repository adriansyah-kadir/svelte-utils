import { noop } from ".";
import { isPromise } from "./checks";
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
export const validated = (schema, action) => ((input) => {
    const res = schema["~standard"].validate(input);
    const run = (r) => {
        if (r.issues)
            throw new ValidationError(r.issues);
        return action(r.value);
    };
    return isPromise(res) ? res.then(run) : run(res);
});
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
    if (!ValidationError.is(error))
        return grouped;
    for (const issue of error.issues) {
        const seg = issue.path?.[0];
        const key = seg === undefined ? "" : String(typeof seg === "object" ? seg.key : seg);
        (grouped[key] ??= []).push(issue);
    }
    return grouped;
}
