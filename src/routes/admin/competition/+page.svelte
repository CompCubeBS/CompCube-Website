<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import { createApiClient } from "$lib/api";
	import { useAuth } from "$lib/auth.svelte";
	import Button from "$lib/components/Button.svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	import type { PlayerOneDecision } from "compcube-client";
	let { data } = $props();
	const auth = useAuth();
	let notice = $state<{ success: boolean; message: string } | null>(null);
	let submitting = $state(false);

	async function runMutation(request: () => Promise<Response>, success: string) {
		submitting = true;
		try {
			const response = await request();
			if (!response.ok) throw new Error("The API rejected this change.");
			notice = { success: true, message: success };
			await invalidateAll();
		} catch (error) {
			notice = { success: false, message: error instanceof Error ? error.message : "The API rejected this change." };
		} finally {
			submitting = false;
		}
	}
	function values(event: SubmitEvent) {
		event.preventDefault();
		return new FormData(event.currentTarget as HTMLFormElement);
	}
	async function createSeason(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).seasons.create({ id: String(form.get("id")), name: String(form.get("name")), description: String(form.get("description") ?? "") || null, startingMmr: Number(form.get("startingMmr")), startsAt: new Date(String(form.get("startsAt"))).toISOString(), endsAt: form.get("endsAt") ? new Date(String(form.get("endsAt"))).toISOString() : null, isCurrent: form.get("isCurrent") === "on" }), "Season created.");
	}
	async function updateSeason(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).seasons.update({ seasonGuid: String(form.get("seasonGuid")), startingMmr: Number(form.get("startingMmr")), isCurrent: form.get("isCurrent") === "on" }), "Season updated.");
	}
	async function createPool(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).pools.create({ seasonGuid: String(form.get("seasonGuid")), name: String(form.get("name")), imageUrl: String(form.get("imageUrl") ?? "") || null, isPublic: form.get("isPublic") === "on" }), "Map pool created.");
	}
	async function publishPool(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).pools.publish({ poolGuid: String(form.get("poolGuid")), isPublic: form.get("isPublic") === "on" }), "Pool visibility updated.");
	}
	async function createQueue(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).queues.create({ slug: String(form.get("slug")), name: String(form.get("name")), poolGuid: String(form.get("poolGuid")), minMmr: Number(form.get("minMmr")), maxMmr: Number(form.get("maxMmr")), startingHealth: Number(form.get("startingHealth")), kFactor: Number(form.get("kFactor")), playerOneDecision: String(form.get("playerOneDecision")) as PlayerOneDecision, competitive: form.get("competitive") === "on", enabled: true }), "Queue created.");
	}
	async function toggleQueue(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).queues.update({ queueGuid: String(form.get("queueGuid")), enabled: form.get("enabled") === "on" }), "Queue updated.");
	}
	async function createFlair(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).flairs.create({ name: String(form.get("name")), color: String(form.get("color") ?? "") || null, imageUrl: String(form.get("imageUrl") ?? "") || null }), "Flair created.");
	}
</script>

<PageMeta
	title="Competition administration"
	description="Manage seasons, pools, queues and map flairs."
	path="/admin/competition" />
<PageHeader
	title="Competition administration"
	description="Configure every object that controls matchmaking and map selection." />
<section class="page-shell page-section admin-page">
	<div class="admin-nav">
		<a href="/admin/users"><i class="pi pi-users"></i>Users</a><a
			class="active"
			href="/admin/competition"
			><i class="pi pi-sliders-h"></i>Competition</a
		><a href="/admin/mock-clients"><i class="pi pi-desktop"></i>Mock clients</a><a href="/maps"><i class="pi pi-map"></i>Pool maps</a>
	</div>
	{#if notice}<p class="notice" class:success={notice.success}>
			{notice.message}
		</p>{/if}
	<div class="grid">
		<article class="surface">
			<header>
				<i class="pi pi-calendar"></i>
				<div>
					<h2>Seasons</h2>
					<p>
						Non-overlapping rating periods and account starting MMR.
					</p>
				</div>
			</header>
			{#each data.seasons as season}<form
					onsubmit={updateSeason}
					class="row">
					<input
						type="hidden"
						name="seasonGuid"
						value={season.guid} />
					<div>
						<strong>{season.name}</strong><small
							>{new Date(season.startsAt).toLocaleDateString()} — {season.endsAt
								? new Date(season.endsAt).toLocaleDateString()
								: "Open"}</small>
					</div>
					<label
						>Starting MMR<input
							type="number"
							name="startingMmr"
							min="0"
							value={season.startingMmr} /></label
					><label class="check"
						><input
							type="checkbox"
							name="isCurrent"
							checked={season.isCurrent} />Current</label
					><Button type="submit" size="small" variant="secondary" disabled={submitting}
						>Save</Button>
				</form>{/each}
			<form onsubmit={createSeason} class="create">
				<h3>New season</h3>
				<label>ID<input name="id" required /></label><label
					>Name<input name="name" required /></label
				><label
					>Starting MMR<input
						type="number"
						name="startingMmr"
						min="0"
						value="1000" /></label
				><label
					>Starts<input
						type="datetime-local"
						name="startsAt"
						required /></label
				><label>Ends<input type="datetime-local" name="endsAt" /></label
				><label class="check"
					><input type="checkbox" name="isCurrent" />Current</label
				><label class="wide"
					>Description<input name="description" /></label
				><Button type="submit" disabled={submitting}><i class="pi pi-plus"></i>Create</Button>
			</form>
		</article>

		<article class="surface">
			<header>
				<i class="pi pi-clone"></i>
				<div>
					<h2>Map pools</h2>
					<p>
						Publish a pool and associate it with the current season.
					</p>
				</div>
			</header>
			{#each data.pools as pool}<form
					onsubmit={publishPool}
					class="row">
					<input type="hidden" name="poolGuid" value={pool.guid} />
					<div>
						<strong>{pool.name}</strong><small class="numeric"
							>{pool.maps?.length ?? 0} maps</small>
					</div>
					<label class="check"
						><input
							type="checkbox"
							name="isPublic"
							checked={pool.isPublic} />Published</label
					><a class="manage" href={`/maps?pool=${pool.guid}`}
						>Manage maps<i class="pi pi-arrow-right"></i></a
					><Button type="submit" size="small" variant="secondary" disabled={submitting}
						>Save</Button>
				</form>{/each}{#if data.current}<form
					onsubmit={createPool}
					class="create">
					<input
						type="hidden"
						name="seasonGuid"
						value={data.current.guid} />
					<h3>New pool</h3>
					<label>Name<input name="name" required /></label><label
						>Image URL<input name="imageUrl" /></label
					><label class="check"
						><input
							type="checkbox"
							name="isPublic" />Published</label
					><Button type="submit" disabled={submitting}
						><i class="pi pi-plus"></i>Create</Button>
				</form>{/if}
		</article>

		<article class="surface">
			<header>
				<i class="pi pi-users"></i>
				<div>
					<h2>Queues</h2>
					<p>
						Rating bounds, health, K-factor, map pool and first-pick
						rule.
					</p>
				</div>
			</header>
			{#each data.queues as queue}<form
					onsubmit={toggleQueue}
					class="row">
					<input type="hidden" name="queueGuid" value={queue.guid} />
					<div>
						<strong>{queue.name}</strong><small
							>{queue.minMmr}–{queue.maxMmr} MMR · {queue.queuedPlayers ??
								0} waiting</small>
					</div>
					<label class="check"
						><input
							type="checkbox"
							name="enabled"
							checked={queue.enabled} />Enabled</label
					><span>{queue.playerOneDecision.replaceAll("_", " ")}</span
					><Button type="submit" size="small" variant="secondary" disabled={submitting}
						>Save</Button>
				</form>{/each}
			<form onsubmit={createQueue} class="create">
				<h3>New queue</h3>
				<label>Slug<input name="slug" required /></label><label
					>Name<input name="name" required /></label
				><label
					>Pool<select name="poolGuid"
						>{#each data.pools as pool}<option value={pool.guid}
								>{pool.name}</option
							>{/each}</select
					></label
				><label
					>Minimum MMR<input
						type="number"
						name="minMmr"
						value="0" /></label
				><label
					>Maximum MMR<input
						type="number"
						name="maxMmr"
						value="9999" /></label
				><label
					>Starting health<input
						type="number"
						step="0.1"
						name="startingHealth"
						value="1" /></label
				><label
					>K-factor<input
						type="number"
						name="kFactor"
						value="100" /></label
				><label
					>First pick<select name="playerOneDecision"
						><option value="lowest_mmr_first">Lowest MMR</option
						><option value="highest_mmr_first">Highest MMR</option
						><option value="random">Random</option></select
					></label
				><label class="check"
					><input
						type="checkbox"
						name="competitive"
						checked />Competitive</label
				><Button type="submit" disabled={submitting}><i class="pi pi-plus"></i>Create</Button>
			</form>
		</article>

		<article class="surface">
			<header>
				<i class="pi pi-tags"></i>
				<div>
					<h2>Flairs</h2>
					<p>Reusable map categories shown throughout the pool.</p>
				</div>
			</header>
			<div class="flairs">
				{#each data.flairs as flair}<span
						style={`--flair:${flair.color ?? "var(--purple)"}`}
						>{flair.name}</span
					>{/each}
			</div>
			<form onsubmit={createFlair} class="create">
				<h3>New flair</h3>
				<label>Name<input name="name" required /></label><label
					>Colour<input
						name="color"
						type="color"
						value="#a878ff" /></label
				><label>Image URL<input name="imageUrl" /></label><Button
					type="submit" disabled={submitting}><i class="pi pi-plus"></i>Create</Button>
			</form>
		</article>
	</div>
</section>

<style>
	.admin-page {
		padding-top: 2rem;
	}
	.admin-nav {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}
	.admin-nav a {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.5rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 0.35rem;
		color: var(--text-muted);
		font: 600 0.75rem var(--font-secondary);
		text-decoration: none;
	}
	.admin-nav a.active {
		border-color: var(--purple);
		color: var(--text);
	}
	.notice {
		padding: 0.8rem;
		border-left: 2px solid var(--danger);
		background: rgba(255, 109, 121, 0.08);
	}
	.notice.success {
		color: var(--success);
		border-color: var(--success);
	}
	.grid {
		display: grid;
		gap: 1rem;
	}
	.grid > article {
		padding: 1.2rem;
	}
	.grid > article > header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-bottom: 1rem;
	}
	.grid > article > header > i {
		font-size: 1.4rem;
		color: var(--purple);
	}
	h2,
	h3,
	p {
		margin: 0;
	}
	header p {
		color: var(--text-muted);
		font-size: 0.75rem;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(12rem, 1fr) repeat(3, auto);
		align-items: center;
		gap: 1rem;
		padding: 0.7rem 0;
		border-top: 1px solid var(--border);
	}
	.row > div {
		display: grid;
	}
	.row small,
	.row span {
		color: var(--text-subtle);
		font: 600 0.68rem var(--font-secondary);
		text-transform: capitalize;
	}
	.manage {
		color: var(--blue);
		font: 600 0.72rem var(--font-secondary);
		text-decoration: none;
	}
	.create {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		align-items: end;
		gap: 0.7rem;
		padding: 1rem;
		margin-top: 1rem;
		border: 1px dashed var(--border-strong);
		border-radius: 0.35rem;
	}
	.create h3 {
		grid-column: 1/-1;
	}
	.create label,
	.row label {
		display: grid;
		gap: 0.25rem;
		color: var(--text-muted);
		font: 600 0.68rem var(--font-secondary);
	}
	.create input,
	.create select,
	.row input {
		min-width: 0;
		padding: 0.55rem;
		border: 1px solid var(--border);
		border-radius: 0.3rem;
		background: var(--background);
		color: var(--text);
	}
	.check {
		display: flex !important;
		grid-template-columns: auto auto;
		align-items: center;
	}
	.check input {
		width: auto;
	}
	.wide {
		grid-column: span 2;
	}
	.flairs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding-block: 0.5rem;
	}
	.flairs span {
		padding: 0.25rem 0.55rem;
		border: 1px solid var(--flair);
		border-radius: 99px;
		color: var(--flair);
		font: 600 0.7rem var(--font-secondary);
	}
	@media (max-width: 850px) {
		.create {
			grid-template-columns: 1fr 1fr;
		}
		.row {
			grid-template-columns: 1fr auto;
		}
		.row > :nth-child(3) {
			display: none;
		}
	}
	@media (max-width: 520px) {
		.create {
			grid-template-columns: 1fr;
		}
		.wide {
			grid-column: auto;
		}
		.admin-nav {
			overflow: auto;
		}
	}
</style>
