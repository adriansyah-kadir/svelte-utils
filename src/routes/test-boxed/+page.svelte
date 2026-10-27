<script lang="ts">
  import { box } from "#lib";

  let raw = $state.raw({
    x: {
      y: 200,
      z: "ok",
    },
    b: 200,
  });

  let deep = $state(false);
  const boxed = $derived(
    box.flat(
      box(
        () => raw,
        (v) => (raw = v),
      ),
      deep,
    ),
  );

  $inspect(raw.x?.y);
</script>

<label for="deep">deep</label>
<input id="deep" type="checkbox" bind:checked={deep} />
<input bind:value={boxed.x.z} />
<input bind:value={boxed.x.y} type="number" />
<input bind:value={boxed.b} type="number" />

<code>
  {JSON.stringify(raw)}
</code>
