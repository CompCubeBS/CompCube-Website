<script lang="ts">
	import Button from "./Button.svelte";
	import Dropdown from "./Dropdown.svelte";
	import { pluginDownloads } from "$lib/data/downloads";

	let { compact = false }: { compact?: boolean } = $props();
	let version = $state(pluginDownloads[0]?.version ?? "");
	const selected = $derived(
		pluginDownloads.find((download) => download.version === version),
	);
	const options = pluginDownloads.map((download) => ({
		label: download.label,
		value: download.version,
		description: download.description,
	}));
</script>

<div class:compact class="download-selector">
	<Dropdown label="Game version" bind:value={version} {options} />
	<Button href={selected?.file ?? "#"} size="large" fullWidth download>
		<i class="pi pi-download" aria-hidden="true"></i>
		Download DLL
	</Button>
</div>

<style>
	.download-selector {
		display: grid;
		grid-template-columns: minmax(13rem, 1fr) minmax(10rem, 0.6fr);
		align-items: end;
		gap: 0.75rem;
	}
	.download-selector:not(.compact) {
		max-width: 38rem;
	}
	@media (max-width: 540px) {
		.download-selector {
			grid-template-columns: 1fr;
		}
	}
</style>
