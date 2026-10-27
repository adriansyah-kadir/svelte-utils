<script lang="ts">
  import { useResource } from "#lib"; // adjust to your path
  import { validated, formValues, fieldIssues, ValidationError } from "#lib";
  import type { StandardSchemaV1 as Std } from "#lib/standard-schema.ts";

  // ── Inline Standard Schema (no validation library needed) ───
  // Mixes plain-key paths (["username"]) and { key } segments on purpose,
  // since libraries differ and fieldIssues has to handle both.
  type User = {
    username: string;
    email: string;
    age: number;
    tags: string[];
    password: string;
    confirm: string;
    agree: true;
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const schema: Std<Record<keyof User, User[keyof User]>, User> = {
    "~standard": {
      version: 1,
      vendor: "inline-demo",
      async validate(input) {
        await sleep(250); // async validation
        const v = input as Record<string, unknown>;
        const text = (k: string) =>
          typeof v[k] === "string" ? (v[k] as string).trim() : "";
        const issues: Std.Issue[] = [];

        const username = text("username");
        if (username.length < 3) {
          issues.push({
            message: "Use at least 3 characters.",
            path: ["username"],
          });
        } else if (username.toLowerCase() === "admin") {
          issues.push({
            message: "That username is taken.",
            path: [{ key: "username" }],
          });
        }

        const email = text("email");
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          issues.push({
            message: "Enter a valid email address.",
            path: ["email"],
          });
        }

        const age = Number(text("age"));
        if (!text("age") || !Number.isInteger(age) || age < 18) {
          issues.push({
            message: "Enter a whole number, 18 or older.",
            path: ["age"],
          });
        }

        const tags = Array.isArray(v.tags) ? (v.tags as string[]) : [];
        if (tags.length === 0)
          issues.push({ message: "Pick at least one tag.", path: ["tags"] });
        if (tags.length > 3)
          issues.push({ message: "Pick three tags at most.", path: ["tags"] });
        const spam = tags.indexOf("spam");
        if (spam >= 0)
          issues.push({
            message: "This tag isn't allowed.",
            path: ["tags", spam],
          });

        const password = typeof v.password === "string" ? v.password : "";
        if (password.length < 8) {
          issues.push({
            message: "Use at least 8 characters.",
            path: ["password"],
          });
        }
        if (v.confirm !== password) {
          issues.push({ message: "Passwords don't match.", path: ["confirm"] });
        }

        if (v.agree !== "on") {
          issues.push({
            message: "You must accept the terms.",
            path: ["agree"],
          });
        }

        // Root-level issue (no path)
        if (username && password && username === password) {
          issues.push({
            message: "Password can't be the same as the username.",
          });
        }

        if (issues.length) return { issues };
        return {
          value: {
            username,
            email,
            age,
            tags,
            password,
            confirm: password,
            agree: true,
          },
        };
      },
    },
  };

  // ── Fake server ─────────────────────────────────────────────
  let failServer = $state(false);

  async function createUser({ password: _p, confirm: _c, ...user }: User) {
    await sleep(600);
    if (failServer) throw new Error("Server unavailable (simulated)");
    return { id: Math.floor(Math.random() * 10_000), ...user };
  }

  // ── Form ────────────────────────────────────────────────────
  const save = useResource(validated(schema, createUser));

  const issues = $derived(fieldIssues<typeof schema>(save.error));
  const validationError = $derived(ValidationError.is(save.error) ? save.error : undefined);
  let lastInput = $state<unknown>();

  const tagOptions = ["svelte", "rust", "go", "spam"];
</script>

{#snippet errors(name: keyof User)}
  {#each issues[name] ?? [] as issue}
    <p class="msg" role="alert">{issue.message}</p>
  {/each}
{/snippet}

<section>
  <h2>Sign up</h2>

  <form
    {@attach formValues(save.refetch, ["tags"])}
    onreset={save.reset}
    novalidate
  >
    <label>
      Username
      <input name="username" autocomplete="off" />
      {@render errors("username")}
    </label>

    <label>
      Email
      <input name="email" type="email" />
      {@render errors("email")}
    </label>

    <label>
      Age
      <input name="age" type="number" />
      {@render errors("age")}
    </label>

    <fieldset>
      <legend>Tags</legend>
      {#each tagOptions as tag}
        <label class="check">
          <input type="checkbox" name="tags" value={tag} />
          {tag}
        </label>
      {/each}
      {@render errors("tags")}
    </fieldset>

    <label>
      Password
      <input name="password" type="password" autocomplete="new-password" />
      {@render errors("password")}
    </label>

    <label>
      Confirm password
      <input name="confirm" type="password" autocomplete="new-password" />
      {@render errors("confirm")}
    </label>

    <label class="check">
      <input type="checkbox" name="agree" />
      I accept the terms
    </label>
    {@render errors("agree")}

    {@render errors("tags")}
    <label class="check">
      <input type="checkbox" bind:checked={failServer} />
      Simulate server error
    </label>

    <div class="actions">
      <button type="submit" disabled={save.fetching}>
        {save.fetching ? "Working…" : "Create account"}
      </button>
      <button type="reset">Reset</button>
    </div>
  </form>

  <div class="status" aria-live="polite">
    {#if save.fetching}
      <p>Validating and sending…</p>
    {:else if validationError}
      <p class="msg">
        Client validation failed: {validationError.issues.length} issue(s). Nothing
        was sent.
      </p>
    {:else if save.failed()}
      <p class="msg">Request failed: {String(save.error)}</p>
    {:else if save.success()}
      <p>Created.</p>
      <pre>{JSON.stringify(save.value, null, 2)}</pre>
    {/if}
  </div>

  <details>
    <summary>Debug</summary>
    <p>Last payload read by <code>formValues</code></p>
    <pre>{JSON.stringify(lastInput, null, 2)}</pre>
    <p>Issues grouped by <code>fieldIssues</code> (key "" is root-level)</p>
    <pre>{JSON.stringify(
        Object.fromEntries(
          Object.entries(issues).map(([k, list]) => [
            k,
            list.map((i) => i.message),
          ]),
        ),
        null,
        2,
      )}</pre>
  </details>
</section>

<style>
  section {
    max-width: 28rem;
    margin: 2rem auto;
    padding: 0 1rem;
    font-family: system-ui, sans-serif;
    color-scheme: light dark;
  }

  form {
    display: grid;
    gap: 0.9rem;
  }

  label {
    display: grid;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  label.check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  fieldset {
    display: grid;
    gap: 0.35rem;
    padding: 0.6rem 0.75rem;
    border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
    border-radius: 6px;
  }

  input:not([type="checkbox"]) {
    padding: 0.4rem 0.5rem;
    font: inherit;
  }

  .msg {
    margin: 0;
    font-size: 0.8rem;
    color: #c0392b;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.4rem 0.9rem;
    font: inherit;
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .status {
    margin-top: 1rem;
    min-height: 2rem;
  }

  pre {
    padding: 0.75rem;
    font-size: 0.75rem;
    background: color-mix(in srgb, currentColor 6%, transparent);
    border-radius: 6px;
    overflow-x: auto;
  }

  details {
    margin-top: 1rem;
    font-size: 0.85rem;
  }
</style>
