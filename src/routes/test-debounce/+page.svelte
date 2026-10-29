<script lang="ts">
  import { useDebounced } from "#lib";

  let search = $state("");
  const searchD = useDebounced(() => search);
</script>

<input bind:value={search} />
{searchD.current}
