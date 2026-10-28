<script lang="ts">
  import {
    catcher,
    createStandardSchema,
    noop,
    useResource,
    useSearchParams,
    validated,
  } from "#lib";

  const sp = useSearchParams({
    age: (...inputs) => inputs.at(0) ?? "10",
    name: (...inputs) => inputs.at(0),
    tags: (...inputs) => inputs,
  });

  sp.current;

  const sc = createStandardSchema((i: typeof sp.current) => {
    if (isNaN(Number(i.age ?? "10")))
      return {
        issues: [{ path: ["age"], message: "NaN" }],
      };

    return {
      value: {
        name: i.name ?? "",
        age: Number(i.age ?? "10"),
        tags: i.tags,
      },
    };
  });

  const ss = useResource(validated(sc, (v) => v));

  $effect(() => {
    catcher(ss.refetch, noop, sp.current);
  });
</script>

<div>
  <button
    onclick={() => {
      sp.clear();
    }}>reset</button
  >

  <label>
    Name
    <input bind:value={sp.current.name} />
  </label>

  <label>
    Age
    <input bind:value={sp.current.age} />
  </label>

  <button
    onclick={() => {
      sp.current.tags = [...sp.current.tags, ""];
    }}>Add tags</button
  >
  {#each sp.current.tags as tag, i}
    <input bind:value={sp.current.tags[i]} />
    <button onclick={() => sp.current.tags.splice(i, 1)}>del</button>
  {/each}

  <code>
    {JSON.stringify(sp.current)}
    {JSON.stringify(ss.value)}
    {JSON.stringify(ss.error)}
  </code>
</div>

<style>
  div {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
</style>
