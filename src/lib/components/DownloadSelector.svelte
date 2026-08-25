<script lang="ts">
	import Button from "./Button.svelte";
	import Dropdown from "./Dropdown.svelte";
	import type { PluginDownload } from "$lib/data/downloads";

	let { compact = false, downloads }: { compact?: boolean; downloads: PluginDownload[] } = $props();
	let version = $state("");
	$effect(() => {
		if (!downloads.some((download) => download.gameVersion === version)) {
			version = downloads[0]?.gameVersion ?? "";
		}
	});
	const selected = $derived(
		downloads.find((download) => download.gameVersion === version),
	);
	const options = $derived(downloads.map((download) => ({
		label: download.label,
		value: download.gameVersion,
		description: download.description,
	})));
</script>

<div class:compact class="download-selector">
	{#if downloads.length}
		<Dropdown label="Game version" bind:value={version} {options} />
		<Button href={selected?.downloadUrl ?? "#"} size="large" fullWidth download>
			<i class="pi pi-download" aria-hidden="true"></i>
			Download DLL
		</Button>
	{:else}
		<p class="unavailable">No public plugin build is available yet.</p>
	{/if}
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
	.unavailable { grid-column: 1 / -1; margin: 0; color: var(--warning); }
	@media (max-width: 540px) {
		.download-selector {
			grid-template-columns: 1fr;
		}
	}
</style>
