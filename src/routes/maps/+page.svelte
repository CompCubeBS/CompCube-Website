<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import { env } from "$env/dynamic/public";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	let { data, form } = $props();
	const playlistUrl = $derived(
		`${(env.PUBLIC_COMPCUBE_API_URL || "https://api.compcube.net").replace(/\/$/, "")}/maps/playlist`,
	);
	function duration(seconds: number) {
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
	}
</script>

<PageMeta
	title="Map pools"
	description="Published CompCube Beat Saber map pools."
	path="/maps" />
<PageHeader
	title="Map pools"
	description="Browse every chart, modifier, category, and published seasonal pool." />

<section class="page-shell page-section map-page">
	<div class="toolbar">
		<nav aria-label="Map pools">
			{#each data.pools as pool}<a
					class:active={pool.guid === data.selectedPool?.guid}
					href={`/maps?pool=${pool.guid}`}
					>{pool.name}{#if pool.isPublic}<i class="pi pi-check-circle"
						></i
						>{/if}</a
				>{/each}
		</nav>
		{#if data.selectedPool}<Button href={playlistUrl} variant="secondary"
				><i class="pi pi-download"></i>BPList</Button
			>{/if}
	</div>
	{#if form?.message}<p class:success={form.success} class="notice">
			{form.message}
		</p>{/if}
	{#if data.canManage && data.selectedPool}
		<form method="POST" action="?/add" class="admin-form surface">
			<input
				type="hidden"
				name="poolGuid"
				value={data.selectedPool.guid} />
			<label
				>BeatSaver key<input
					name="key"
					required
					placeholder="1a2b" /></label>
			<label
				>Characteristic<input
					name="characteristic"
					value="Standard"
					required /></label>
			<label
				>Difficulty<select name="difficulty"
					>{#each data.difficulties as difficulty}<option
							value={difficulty}
							>{difficulty === "ExpertPlus"
								? "Expert+"
								: difficulty}</option
						>{/each}</select
				></label>
			<label
				>Flair<select name="flairGuid"
					><option value="">None</option
					>{#each data.flairs as flair}<option value={flair.guid}
							>{flair.name}</option
						>{/each}</select
				></label>
			<fieldset>
				<legend>Modifiers</legend
				>{#each data.modifiers as modifier}<label class="check"
						><input
							type="checkbox"
							name="modifiers"
							value={modifier} />{modifier}</label
					>{/each}
			</fieldset>
			<Button type="submit"
				><i class="pi pi-plus"></i>Add from BeatSaver</Button>
		</form>
	{/if}
	<div class="summary">
		<span>{data.selectedPool?.name ?? "No active pool"}</span><strong
			class="numeric">{data.maps.length} charts</strong>
	</div>
	<div class="map-grid">
		{#each data.maps as map, index (map.guid)}
			<article class="map-card surface">
				<div class="cover">
					{#if map.imageUrl}<img src={map.imageUrl} alt="" />{:else}<i
							class="pi pi-map"></i
						>{/if}<span class="numeric"
						>{String(index + 1).padStart(2, "0")}</span>
				</div>
				<div class="details">
					<div>
						<p class="eyebrow">
							{map.flair?.name ?? "Uncategorised"}
						</p>
						<h2>{map.name}</h2>
					</div>
					<div class="chips">
						<span>{map.characteristic}</span><span
							>{map.difficulty === "ExpertPlus"
								? "Expert+"
								: map.difficulty}</span
						>{#each map.modifiers as modifier}<span class="modifier"
								>{modifier}</span
							>{/each}
					</div>
					<div class="metadata numeric">
						<span
							><i class="pi pi-clock"></i>{duration(
								map.durationSeconds,
							)}</span
						><span>MAX {map.maxScore.toLocaleString()}</span><code
							>{map.hash.slice(0, 10)}…</code>
					</div>
				</div>
				<div class="actions">
					<a
						href={`https://beatsaver.com/maps/${map.key}`}
						target="_blank"
						rel="noreferrer"
						aria-label="Open on BeatSaver"
						><i class="pi pi-external-link"></i></a
					>{#if data.canManage}<form method="POST" action="?/remove">
							<input
								type="hidden"
								name="mapGuid"
								value={map.guid} /><button
								aria-label="Remove map"
								><i class="pi pi-trash"></i></button>
						</form>{/if}
				</div>
			</article>
		{:else}<p class="empty-state surface">
				This pool does not have any maps yet.
			</p>{/each}
	</div>
</section>

<style>
	.map-page {
		padding-top: 2rem;
	}
	.toolbar,
	.summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.toolbar nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}
	.toolbar nav a {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 99px;
		color: var(--text-muted);
		font: 600 0.78rem var(--font-secondary);
		text-decoration: none;
	}
	.toolbar nav a.active {
		border-color: var(--purple);
		color: var(--text);
		background: rgba(168, 120, 255, 0.1);
	}
	.notice {
		padding: 0.8rem;
		border-left: 2px solid var(--danger);
		background: rgba(255, 109, 121, 0.08);
	}
	.notice.success {
		border-color: var(--success);
		color: var(--success);
	}
	.admin-form {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		align-items: end;
		gap: 1rem;
		padding: 1.2rem;
		margin-bottom: 2rem;
	}
	.admin-form label {
		display: grid;
		gap: 0.35rem;
		color: var(--text-muted);
		font: 600 0.72rem var(--font-secondary);
	}
	input,
	select {
		width: 100%;
		padding: 0.65rem;
		border: 1px solid var(--border);
		border-radius: 0.35rem;
		background: var(--background-soft);
		color: var(--text);
	}
	fieldset {
		grid-column: 1/-1;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		border: 0;
		padding: 0;
		margin: 0;
	}
	legend {
		color: var(--text-muted);
		font: 0.72rem var(--font-secondary);
		margin-bottom: 0.4rem;
	}
	.check {
		display: flex !important;
		grid-template-columns: auto auto;
		align-items: center;
	}
	.check input {
		width: auto;
	}
	.summary {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border);
		color: var(--text-muted);
		font-family: var(--font-secondary);
	}
	.map-grid {
		display: grid;
		gap: 0.7rem;
	}
	.map-card {
		display: grid;
		grid-template-columns: 5rem 1fr auto;
		gap: 1rem;
		padding: 1rem;
		transition:
			transform var(--transition),
			border-color var(--transition);
	}
	.map-card:hover {
		border-color: var(--border-strong);
	}
	.cover {
		position: relative;
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		border-radius: 0.35rem;
		overflow: hidden;
		background: var(--background-soft);
		color: var(--text-subtle);
	}
	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.cover span {
		position: absolute;
		left: 0.35rem;
		bottom: 0.25rem;
		padding: 0.1rem 0.3rem;
		background: #08090dcc;
		font-size: 0.65rem;
	}
	.details {
		display: grid;
		gap: 0.65rem;
		min-width: 0;
	}
	.eyebrow {
		margin: 0;
		color: var(--pink);
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.details h2 {
		margin: 0.1rem 0 0;
		font: 700 1.1rem var(--font-secondary);
	}
	.chips,
	.metadata {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.chips span {
		padding: 0.15rem 0.45rem;
		border: 1px solid var(--border-strong);
		border-radius: 99px;
		color: var(--text-muted);
		font: 600 0.68rem var(--font-secondary);
	}
	.chips .modifier {
		color: var(--blue);
	}
	.metadata {
		color: var(--text-subtle);
		font-size: 0.68rem;
	}
	.metadata span {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.actions {
		display: flex;
		align-items: start;
		gap: 0.3rem;
	}
	.actions a,
	.actions button {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border: 0;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		text-decoration: none;
	}
	.actions a:hover {
		color: var(--blue);
	}
	.actions button:hover {
		color: var(--danger);
	}
	@media (max-width: 800px) {
		.admin-form {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 560px) {
		.toolbar,
		.summary {
			align-items: start;
			flex-direction: column;
		}
		.admin-form {
			grid-template-columns: 1fr;
		}
		.map-card {
			grid-template-columns: 4rem 1fr;
		}
		.actions {
			grid-column: 2;
		}
	}
</style>
