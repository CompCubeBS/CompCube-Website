<script lang="ts">
	import type { LeaderboardEntry } from "compcube-client";

	let {
		users,
		compact = false,
	}: {
		users: LeaderboardEntry[];
		compact?: boolean;
	} = $props();
</script>

<div class="table-wrap surface">
	<table>
		<thead>
			<tr>
				<th>Rank</th>
				<th>Player</th>
				<th>MMR</th>
				{#if !compact}<th>Record</th><th>Streak</th>{/if}
			</tr>
		</thead>
		<tbody>
			{#each users as user (user.userGuid)}
				<tr>
					<td class="rank numeric">#{user.rank}</td>
					<td>
						<a href={`/users/${user.userGuid}`}>
							<span>{user.username}</span>
						</a>
					</td>
					<td class="numeric mmr">{user.mmr.toLocaleString()}</td>
					{#if !compact}
						<td class="numeric muted"
							>{user.wins}–{Math.max(
								0,
								user.totalGames - user.wins,
							)}</td>
						<td class="numeric muted">{user.winStreak ?? 0}</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
	{#if users.length === 0}<p class="empty-state">
			Leaderboard data is unavailable right now.
		</p>{/if}
</div>

<style>
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-secondary);
	}
	th,
	td {
		padding: 0.9rem 1rem;
		text-align: left;
		border-bottom: 1px solid var(--border);
	}
	th {
		color: var(--text-subtle);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	tbody tr:last-child td {
		border-bottom: 0;
	}
	tbody tr:hover {
		background: linear-gradient(
			90deg,
			var(--red-soft),
			transparent 38%,
			transparent 62%,
			var(--blue-soft)
		);
	}
	td a {
		display: flex;
		align-items: baseline;
		gap: 0.65rem;
		color: var(--text);
		font-weight: 650;
		text-decoration: none;
	}
	td a:hover span {
		color: var(--blue);
	}
	.rank {
		width: 5rem;
		color: var(--text-muted);
	}
	.mmr {
		color: var(--text);
		font-weight: 700;
	}
	.empty-state {
		margin: 0;
	}
</style>
