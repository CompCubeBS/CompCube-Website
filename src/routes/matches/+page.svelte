<script lang="ts">
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	let { data } = $props();
	const active = [
		"waiting_players",
		"awaiting_discards",
		"awaiting_pick",
		"countdown",
		"playing",
		"awaiting_scores",
		"round_results",
		"paused",
	];
	function player(match: (typeof data.matches)[number], role: string) {
		return (
			match.participants?.find((entry) => entry.role === role)?.user
				?.username ?? "TBD"
		);
	}
</script>

<PageMeta
	title="Matches"
	description="Live and completed CompCube matches."
	path="/matches" />
<PageHeader
	title="Matches"
	description="Watch current matches live or inspect every persisted round from match history." />
<section class="page-shell page-section matches-page">
	<nav>
		<a href="/matches" class:active={!data.status}>All</a
		>{#each ["playing", "awaiting_scores", "paused", "completed"] as status}<a
				href={`/matches?status=${status}`}
				class:active={data.status === status}
				>{status.replaceAll("_", " ")}</a
			>{/each}
	</nav>
	<div class="match-grid">
		{#each data.matches as match (match.guid)}<a
				class="match surface"
				href={`/matches/${match.guid}`}>
				<div class="match-top">
					<span class:live={active.includes(match.status)}
						><i
							class={`pi ${active.includes(match.status) ? "pi-circle-fill" : "pi-check-circle"}`}
						></i
						>{match.status.replaceAll("_", " ")}</span
					><time>{new Date(match.createdAt).toLocaleString()}</time>
				</div>
				<div class="versus">
					<strong class="red">{player(match, "red")}</strong><span
						>VS</span
					><strong class="blue">{player(match, "blue")}</strong>
				</div>
				<div class="match-meta">
					<span>Round {match.currentRound}</span><span
						>{match.competitive
							? "Competitive"
							: "Exhibition"}</span
					>{#if match.outcomeKind}<span>{match.outcomeKind}</span
						>{/if}
				</div>
			</a>{:else}<p class="empty-state surface">
				No matches match this view.
			</p>{/each}
	</div>
</section>

<style>
	.matches-page {
		padding-top: 2rem;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 1.5rem;
	}
	nav a {
		padding: 0.4rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 99px;
		color: var(--text-muted);
		font: 600 0.72rem var(--font-secondary);
		text-decoration: none;
		text-transform: capitalize;
	}
	nav a.active {
		color: var(--text);
		border-color: var(--purple);
	}
	.match-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
	}
	.match {
		display: grid;
		gap: 1.4rem;
		padding: 1.25rem;
		color: inherit;
		text-decoration: none;
		transition:
			transform var(--transition),
			border-color var(--transition);
	}
	.match:hover {
		border-color: var(--border-strong);
	}
	.match-top,
	.match-meta,
	.versus {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.match-top {
		color: var(--text-subtle);
		font: 600 0.68rem var(--font-secondary);
		text-transform: capitalize;
	}
	.match-top span {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.match-top .live {
		color: var(--success);
	}
	.match-top .live i {
		font-size: 0.45rem;
		animation: pulse 1.8s infinite;
	}
	.versus strong {
		font: 700 1.25rem var(--font-secondary);
	}
	.versus .red {
		color: #ff8d9d;
	}
	.versus .blue {
		color: #84afff;
	}
	.versus span {
		color: var(--text-subtle);
		font: 0.7rem var(--font-numeric);
	}
	.match-meta {
		justify-content: start;
		color: var(--text-muted);
		font: 600 0.72rem var(--font-secondary);
	}
	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}
	@media (max-width: 720px) {
		.match-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
