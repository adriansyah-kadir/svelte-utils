<script lang="ts">
  import { useAction, PaginationState } from "#lib";
  import { untrack } from "svelte";

  // ── Fake backend ────────────────────────────────────────────
  type Role = "admin" | "editor" | "viewer";
  type User = {
    id: number;
    name: string;
    email: string;
    role: Role;
    joined: string;
  };
  type Query = {
    search: string;
    role: Role | "all";
    page: number;
    pageSize: number;
    fail: boolean;
  };
  type Page = { rows: User[]; total: number };

  const first = [
    "Ada",
    "Linus",
    "Grace",
    "Alan",
    "Margaret",
    "Dennis",
    "Barbara",
    "Ken",
    "Radia",
    "Tim",
  ];
  const last = [
    "Lovelace",
    "Hopper",
    "Turing",
    "Hamilton",
    "Ritchie",
    "Liskov",
    "Thompson",
    "Perlman",
    "Knuth",
  ];
  const roles: Role[] = ["admin", "editor", "viewer"];

  const DB: User[] = Array.from({ length: 87 }, (_, i) => {
    const f = first[i % first.length];
    const l = last[(i * 7 + 3) % last.length];
    return {
      id: i + 1,
      name: `${f} ${l}`,
      email: `${f}.${l}@example.com`.toLowerCase(),
      role: roles[i % roles.length],
      joined: new Date(2023, i % 12, (i % 27) + 1).toISOString().slice(0, 10),
    };
  });

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** Random latency so responses can arrive out of order. */
  async function searchUsers(q: Query): Promise<Page> {
    await sleep(150 + Math.random() * 750);
    if (q.fail) throw new Error("Server unavailable (simulated)");

    const s = q.search.trim().toLowerCase();
    const matches = DB.filter(
      (u) =>
        (q.role === "all" || u.role === q.role) &&
        (!s || u.name.toLowerCase().includes(s) || u.email.includes(s)),
    );
    const offset = (q.page - 1) * q.pageSize;
    return {
      rows: matches.slice(offset, offset + q.pageSize),
      total: matches.length,
    };
  }

  // ── Filter state ────────────────────────────────────────────
  let search = $state("");
  let role = $state<Query["role"]>("all");
  let pageSize = $state(10);
  let fail = $state(false);

  // ── Resource + pagination ───────────────────────────────────
  const users = useAction(searchUsers);

  const pagination = new PaginationState({
    pageSize: () => pageSize,
    // Keeps the previous total while a refetch is in flight, so the pager doesn't flicker.
    total: () => users.value?.total ?? 0,
  });

  const currentQuery = (): Query => ({
    search,
    role,
    pageSize,
    page: pagination.page,
    fail,
  });

  // Refetch whenever the query changes.
  // `pagination.page` is clamped against `total`, which comes from `users.value`,
  // so this effect also re-runs after every response. The key check stops that
  // from turning into a fetch loop (and skips the mount run, which `initial` covers).
  $effect(() => {
    const q = currentQuery();
    untrack(() => users.run(q).catch(() => {}));
  });

  const rows = $derived(users.value?.rows ?? []);
  const lastPage = $derived(pagination.totalPages ?? 1);
</script>

<section>
  <h2>Users</h2>

  <div class="controls">
    <label>
      Search
      <input type="search" placeholder="Name or email" bind:value={search} />
    </label>

    <label>
      Role
      <select bind:value={role} onchange={pagination.reset}>
        <option value="all">All roles</option>
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </select>
    </label>

    <label>
      Rows per page
      <select bind:value={pageSize} onchange={pagination.reset}>
        {#each [5, 10, 25] as n}
          <option value={n}>{n}</option>
        {/each}
      </select>
    </label>

    <label class="check">
      <input type="checkbox" bind:checked={fail} />
      Simulate server error
    </label>
  </div>

  {#if users.failed()}
    <div class="error" role="alert">
      <span>Couldn't load users: {String(users.error)}</span>
      <button onclick={() => users.run(currentQuery()).catch(() => {})}
        >Retry</button
      >
    </div>
  {/if}

  <div class="table-wrap" class:stale={users.loading} aria-busy={users.loading}>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as user (user.id)}
          <tr>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{user.joined}</td>
          </tr>
        {:else}
          <tr>
            <td colspan="5" class="empty">
              {#if users.success()}
                No users match. Clear the search or pick another role.
              {:else if users.loading}
                Loading…
              {:else}
                No data.
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <footer>
    <span aria-live="polite">
      {#if pagination.total === 0}
        0 results
      {:else}
        {pagination.start}–{pagination.end} of {pagination.total ?? "?"}
      {/if}
      {#if users.loading}<em>updating…</em>{/if}
    </span>

    <nav aria-label="Pagination">
      <button
        onclick={() => pagination.goTo(1)}
        disabled={!pagination.hasPrevious}>First</button
      >
      <button onclick={pagination.previous} disabled={!pagination.hasPrevious}
        >Previous</button
      >
      <span>Page {pagination.page} of {pagination.totalPages ?? "?"}</span>
      <button onclick={pagination.next} disabled={!pagination.hasNext}
        >Next</button
      >
      <button
        onclick={() => pagination.goTo(lastPage)}
        disabled={!pagination.hasNext}>Last</button
      >
    </nav>
  </footer>

  <pre class="debug">{JSON.stringify(
      {
        page: pagination.page,
        pageSize: pagination.pageSize,
        offset: pagination.offset,
        total: pagination.total,
        totalPages: pagination.totalPages,
        fetching: users.loading,
      },
      null,
      2,
    )}</pre>
</section>

<style>
  section {
    max-width: 52rem;
    margin: 2rem auto;
    padding: 0 1rem;
    font-family: system-ui, sans-serif;
    color-scheme: light dark;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: end;
    margin-bottom: 1rem;
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

  input[type="search"],
  select {
    padding: 0.4rem 0.5rem;
    font: inherit;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
    border-radius: 6px;
    transition: opacity 0.15s;
  }

  .table-wrap.stale {
    opacity: 0.55;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  th,
  td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
    white-space: nowrap;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  .empty {
    text-align: center;
    padding: 2rem 0.75rem;
    white-space: normal;
  }

  .error {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.6rem 0.75rem;
    margin-bottom: 0.75rem;
    border: 1px solid #c0392b;
    border-radius: 6px;
    color: #c0392b;
  }

  footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
    font-size: 0.875rem;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  button {
    padding: 0.35rem 0.7rem;
    font: inherit;
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .debug {
    margin-top: 1.5rem;
    padding: 0.75rem;
    font-size: 0.75rem;
    background: color-mix(in srgb, currentColor 6%, transparent);
    border-radius: 6px;
  }
</style>
