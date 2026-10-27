<script lang="ts">
  import { debounced } from "#lib";

  let search = $state("");
  const searchD = debounced(() => search);
</script>

<input bind:value={search} />
{searchD.current}
