<script lang="ts">
	import type {
		CompetitiveStatistics,
		MatchParticipant,
		User,
	} from "compcube-client";
	let {
		user,
	}: {
		user: User & {
			competitiveStatistics?: CompetitiveStatistics[];
			matchParticipants?: MatchParticipant[];
		};
	} = $props();
	const stats = $derived(
		user.competitiveStatistics?.find((entry) => entry.season?.isCurrent) ??
			user.competitiveStatistics?.[0],
	);
	const losses = $derived(
		Math.max(0, (stats?.totalGames ?? 0) - (stats?.wins ?? 0)),
	);
	const winRate = $derived(
		stats?.totalGames
			? Math.round((stats.wins / stats.totalGames) * 100)
			: 0,
	);
	const matchHistory = $derived(
		[...(user.matchParticipants ?? [])].sort(
			(a, b) =>
				new Date(b.match?.startedAt ?? b.createdAt).getTime() -
				new Date(a.match?.startedAt ?? a.createdAt).getTime(),
		),
	);
</script>

<section class="profile">
	<header>
		<div class="identity">
			{#if user.avatarUrl}<img src={user.avatarUrl} alt="" />{/if}
			<div>
				<h1>{user.username}</h1>
				<div class="tags">
					{#each user.permissions as permission}<span
							>{permission
								.replace("role:", "")
								.replace("perk:", "")}</span
						>{/each}
					{#if user.banned}<span class="banned"
							><i class="pi pi-ban"></i>Banned</span
						>{/if}
				</div>
			</div>
		</div>
		<div class="rank-block">
			<span>Current MMR</span><strong class="numeric"
				>{stats?.currentMmr.toLocaleString() ?? "—"}</strong>
		</div>
	</header>
	<div class="stats">
		<div>
			<span>Starting MMR</span><strong class="numeric"
				>{stats?.startingMmr ?? "—"}</strong>
		</div>
		<div>
			<span>Wins</span><strong class="numeric">{stats?.wins ?? 0}</strong>
		</div>
		<div><span>Losses</span><strong class="numeric">{losses}</strong></div>
		<div>
			<span>Win rate</span><strong class="numeric">{winRate}%</strong>
		</div>
		<div>
			<span>Current streak</span><strong class="numeric"
				>{stats?.winStreak ?? 0}</strong>
		</div>
		<div>
			<span>Best streak</span><strong class="numeric"
				>{stats?.bestWinStreak ?? 0}</strong>
		</div>
	</div>
	<footer>
		<span class="numeric">CompCube {user.guid}</span>
		{#if user.platformId}<span class="numeric"
				><i class="pi pi-id-card"></i>{user.platformId}</span
			>{/if}
		{#if user.discordId}<span
				><i class="pi pi-discord"></i>Discord linked</span
			>{/if}
	</footer>
	<section class="history">
		<div class="history-heading">
			<div><h2>Recent matches</h2></div>
			<strong class="numeric">{matchHistory.length}</strong>
		</div>
		<div class="match-list">
			{#each matchHistory as participant (participant.guid)}
				<a href={`/matches/${participant.matchGuid}`} class="surface">
					<span
						class={participant.match?.winnerUserGuid === user.guid
							? "won"
							: participant.match?.outcomeKind === "draw"
								? "draw"
								: "lost"}>
						{participant.match?.outcomeKind === "draw"
							? "Draw"
							: participant.match?.winnerUserGuid === user.guid
								? "Won"
								: participant.match?.status === "completed"
									? "Lost"
									: (participant.match?.status.replaceAll(
											"_",
											" ",
										) ?? "Match")}
					</span>
					<div>
						<strong
							>Round {participant.match?.currentRound ??
								"—"}</strong
						><small
							>{new Date(
								participant.match?.startedAt ??
									participant.createdAt,
							).toLocaleString()}</small>
					</div>
					<div class="rating-change">
						<strong class="numeric">{participant.initialMmr}</strong
						><i class="pi pi-arrow-right"></i><strong
							class="numeric"
							>{participant.finalMmr ?? "—"}</strong>
					</div>
					<i class="pi pi-chevron-right"></i>
				</a>
			{:else}
				<p class="empty-state surface">
					This player has not completed a match yet.
				</p>
			{/each}
		</div>
	</section>
</section>

<style>
	.profile {
		padding-block: clamp(4rem, 9vw, 8rem);
	}
	header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--border);
	}
	.identity {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.identity img {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid var(--border);
	}
	h1,
	h2 {
		margin: 0;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.65rem;
	}
	.tags span {
		padding: 0.18rem 0.5rem;
		border: 1px solid var(--border-strong);
		border-radius: 99px;
		color: var(--text-muted);
		font: 600 0.7rem var(--font-secondary);
		text-transform: capitalize;
	}
	.tags .banned {
		color: var(--danger);
		border-color: var(--danger);
	}
	.rank-block {
		display: grid;
		justify-items: end;
	}
	.rank-block span,
	.stats span,
	footer {
		color: var(--text-subtle);
		font-family: var(--font-secondary);
		font-size: 0.75rem;
	}
	.rank-block strong {
		font-size: clamp(2rem, 5vw, 3.5rem);
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-bottom: 1px solid var(--border);
	}
	.stats > div {
		display: grid;
		gap: 0.25rem;
		padding: 2rem 1rem 2rem 0;
		border-bottom: 1px solid var(--border);
	}
	.stats > div:nth-child(3n + 2),
	.stats > div:nth-child(3n + 3) {
		padding-left: 2rem;
		border-left: 1px solid var(--border);
	}
	.stats strong {
		font-size: clamp(1.5rem, 4vw, 2.4rem);
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 1rem;
	}
	footer span {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.history {
		padding-top: 4rem;
	}
	.history-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		margin-bottom: 1rem;
	}
	.history-heading span {
		color: var(--purple);
		font: 700 0.68rem var(--font-secondary);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}
	.history-heading > strong {
		color: var(--text-subtle);
		font-size: 1.5rem;
	}
	.match-list {
		display: grid;
		gap: 0.5rem;
	}
	.match-list > a {
		display: grid;
		grid-template-columns: 5rem 1fr auto 1rem;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1rem;
		color: inherit;
		text-decoration: none;
		transition:
			transform var(--transition),
			border-color var(--transition);
	}
	.match-list > a:hover {
		transform: translateX(3px);
		border-color: var(--border-strong);
	}
	.match-list > a > span {
		font: 700 0.72rem var(--font-secondary);
		text-transform: uppercase;
	}
	.match-list .won {
		color: var(--success);
	}
	.match-list .lost {
		color: var(--danger);
	}
	.match-list .draw {
		color: var(--purple);
	}
	.match-list > a > div {
		display: grid;
	}
	.match-list small {
		color: var(--text-subtle);
		font: 500 0.68rem var(--font-secondary);
	}
	.rating-change {
		display: flex !important;
		align-items: center;
		gap: 0.55rem;
	}
	.rating-change i,
	.match-list > a > i {
		color: var(--text-subtle);
		font-size: 0.7rem;
	}
	@media (max-width: 620px) {
		header {
			align-items: start;
			flex-direction: column;
		}
		.rank-block {
			justify-items: start;
		}
		.stats {
			grid-template-columns: repeat(2, 1fr);
		}
		.stats > div:nth-child(n) {
			padding-left: 0;
			border-left: 0;
		}
		.stats > div:nth-child(even) {
			padding-left: 1.25rem;
			border-left: 1px solid var(--border);
		}
		footer {
			flex-direction: column;
		}
		.match-list > a {
			grid-template-columns: 4rem 1fr 1rem;
		}
		.rating-change {
			display: none !important;
		}
	}
</style>
