import type { Attachment } from "svelte/attachments";
import type { StandardSchemaV1 as Std } from "./standard-schema";
export declare class ValidationError extends Error {
    readonly issues: readonly Std.Issue[];
    constructor(issues: readonly Std.Issue[]);
    static is(error: unknown): error is ValidationError;
}
/** Validate input against any Standard Schema, then run the action with the parsed output. */
export declare const validated: <S extends Std<any, any>, R>(schema: S, action: (output: Std.InferOutput<S>) => Promise<R>) => (input: unknown) => Promise<R>;
type Values = Record<string, FormDataEntryValue | FormDataEntryValue[] | null>;
/** Read a form into a plain object. Multi-value fields use getAll. */
export declare function readForm(form: HTMLFormElement, arrays?: string[]): Values;
/** On submit: prevent the default, read the form, and pass the values to `onValues`. */
export declare function formValues(onValues: (values: Values) => unknown, arrays?: string[]): Attachment<HTMLFormElement>;
/** Group an error's issues by top-level field. Non-validation errors give no issues. */
type AnySchema = Std<any, any>;
type Keys<S extends AnySchema> = Extract<keyof Std.InferInput<S>, string>;
/** Field names from the schema, plus "" for root-level issues. Only fields with issues are present. */
export type FieldIssues<S extends AnySchema = AnySchema> = Partial<Record<Keys<S> | "", Std.Issue[]>>;
export declare function fieldIssues<S extends AnySchema>(error: unknown, _schema?: S): FieldIssues<S>;
export {};
