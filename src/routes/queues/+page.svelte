<script lang="ts">
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	let { data } = $props();
</script>

<PageMeta
	title="Queues"
	description="Current CompCube matchmaking queues."
	path="/queues" />
<PageHeader
	title="Matchmaking queues"
	description="Queue availability, player counts, rating ranges and the pool each queue uses." />
<section class="page-shell page-section queue-grid">
	{#each data.queues as queue}<article
			class="surface"
			class:disabled={!queue.enabled}>
			<header>
				<span class:online={queue.enabled}
					><i class="pi pi-circle-fill"></i>{queue.enabled
						? "Open"
						: "Closed"}</span
				><strong class="numeric"
					>{queue.queuedPlayers ?? queue.players?.length ?? 0} waiting</strong>
			</header>
			<h2>{queue.name}</h2>
			<p>{queue.pool?.name ?? "No map pool"}</p>
			<dl>
				<div>
					<dt>Rating</dt>
					<dd class="numeric">{queue.minMmr}–{queue.maxMmr}</dd>
				</div>
				<div>
					<dt>Starting health</dt>
					<dd class="numeric">{queue.startingHealth}</dd>
				</div>
				<div>
					<dt>First pick</dt>
					<dd>{queue.playerOneDecision.replaceAll("_", " ")}</dd>
				</div>
				<div>
					<dt>Mode</dt>
					<dd>{queue.competitive ? "Competitive" : "Exhibition"}</dd>
				</div>
			</dl>
		</article>{:else}<p class="empty-state surface">
			No matchmaking queues are configured.
		</p>{/each}
</section>

<style>
	.queue-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.8rem;
		padding-top: 2rem;
	}
	.queue-grid article {
		padding: 1.2rem;
		transition:
			transform var(--transition),
			border-color var(--transition);
	}
	.queue-grid article:hover {
		border-color: var(--border-strong);
	}
	.queue-grid article.disabled {
		opacity: 0.58;
	}
	.queue-grid header {
		display: flex;
		justify-content: space-between;
		color: var(--text-subtle);
		font: 600 0.68rem var(--font-secondary);
	}
	header span {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	header span i {
		font-size: 0.4rem;
	}
	header .online {
		color: var(--success);
	}
	h2 {
		margin: 1.5rem 0 0.2rem;
		font: 700 1.4rem var(--font-secondary);
	}
	p {
		color: var(--text-muted);
	}
	dl {
		display: grid;
		gap: 0.55rem;
		margin: 1.5rem 0 0;
	}
	dl div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 0.55rem;
		border-top: 1px solid var(--border);
		font: 600 0.72rem var(--font-secondary);
	}
	dt {
		color: var(--text-subtle);
	}
	dd {
		margin: 0;
		text-transform: capitalize;
	}
	@media (max-width: 850px) {
		.queue-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 560px) {
		.queue-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
