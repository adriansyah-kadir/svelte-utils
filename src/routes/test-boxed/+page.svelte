<script lang="ts">
  import { box } from "#lib";

  let raw = $state.raw({
    x: {
      y: 200,
      z: "ok",
    },
    b: 200,
    tags: []
  });

  const boxed = box(() => raw, v => raw = v)
  const z = box.child(box.child(boxed, "x"), "z")
  const y = box.child(box.child(boxed, "x"), "y")
  const b = box.child(boxed, "b")
  $inspect(y.current);
</script>

<label for="deep">deep</label>
<input bind:value={z.current} />
<input bind:value={y.current} type="number" />
<input bind:value={b.current} type="number" />

<code>
  {JSON.stringify(raw)}
</code>
