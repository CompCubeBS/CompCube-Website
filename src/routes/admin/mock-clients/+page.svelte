<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import NumberFlow from "@number-flow/svelte";
	import { createApiClient } from "$lib/api";
	import { useAuth } from "$lib/auth.svelte";
	import Button from "$lib/components/Button.svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	import type { Match, MockClient } from "compcube-client";
	import { onMount } from "svelte";

	let { data } = $props();
	const auth = useAuth();
	let now = $state(Date.now());
	let notice = $state<{ success: boolean; message: string } | null>(null);
	let submitting = $state(false);
	const matches = $derived.by((): Match[] => {
		const grouped = new Map<string, Match>();
		for (const client of data.clients as MockClient[]) {
			if (client.matchGuid && client.match)
				grouped.set(client.matchGuid, client.match);
		}
		return [...grouped.values()];
	});

	onMount(() => {
		const interval = setInterval(() => (now = Date.now()), 100);
		const socket = createApiClient(fetch, auth.token).socket;
		const unsubscribe: Array<() => void> = [];
		let disposed = false;
		let refreshTimer: ReturnType<typeof setTimeout> | undefined;
		const refresh = () => {
			clearTimeout(refreshTimer);
			refreshTimer = setTimeout(() => void invalidateAll(), 120);
		};
		void socket
			.connect()
			.then(() => {
				if (disposed) return;
				for (const event of [
					"matchCreated",
					"cardsUpdated",
					"pickPhaseStarted",
					"playerSelectedMap",
					"roundStarted",
					"startMap",
					"roundResults",
					"timerUpdated",
					"matchFinished",
				] as const)
					unsubscribe.push(socket.on(event, refresh));
			})
			.catch(() => undefined);
		return () => {
			disposed = true;
			clearInterval(interval);
			clearTimeout(refreshTimer);
			for (const stop of unsubscribe) stop();
			socket.disconnect();
		};
	});

	function competitors(match: Match) {
		return [...(match.participants ?? [])]
			.filter((entry) => entry.role !== "spectator")
			.sort((a, b) => (a.role === "red" ? -1 : b.role === "red" ? 1 : 0));
	}
	function clientFor(match: Match, userGuid: string) {
		return (data.clients as MockClient[]).find(
			(client) =>
				client.matchGuid === match.guid &&
				client.impersonatedUserGuid === userGuid,
		);
	}
	function activeTimer(match: Match) {
		return match.timers
			?.filter((timer) =>
				["scheduled", "processing", "paused"].includes(timer.status),
			)
			.sort(
				(a, b) =>
					new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
			)[0];
	}
	function remaining(match: Match) {
		const timer = activeTimer(match);
		if (!timer) return 0;
		return timer.status === "paused"
			? Math.max(0, Math.ceil((timer.pausedRemainingMs ?? 0) / 1000))
			: Math.max(
					0,
					Math.ceil((new Date(timer.dueAt).getTime() - now) / 1000),
				);
	}
	function hand(match: Match, userGuid: string) {
		return match.hands?.find((entry) => entry.userGuid === userGuid);
	}
	function currentRound(match: Match) {
		return match.rounds?.findLast((round) => !round.endedAt);
	}
	async function runMutation(
		request: () => Promise<Response>,
		success: string,
	) {
		submitting = true;
		try {
			const response = await request();
			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as {
					error?: { message?: string };
				} | null;
				throw new Error(
					payload?.error?.message ??
						"The mock client action was rejected.",
				);
			}
			notice = { success: true, message: success };
			await invalidateAll();
		} catch (error) {
			notice = {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "The mock client action was rejected.",
			};
		} finally {
			submitting = false;
		}
	}
	async function createMatch(event: SubmitEvent) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		await runMutation(
			() =>
				createApiClient(
					fetch,
					auth.token,
				).mockClients.createQueuedMatch({
					mockPlatformId: String(
						form.get("mockPlatformId") ?? "",
					).trim(),
				}),
			"The queued plugin was paired with a mock opponent.",
		);
	}
	async function act(event: SubmitEvent) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		const clientGuid = String(form.get("clientGuid") ?? "");
		const actionName = String(form.get("actionName") ?? "");
		let action: import("compcube-client").MockClientAction;
		if (actionName === "discard")
			action = {
				action: "discard",
				mapGuids: form.getAll("mapGuids").map(String),
			};
		else if (actionName === "pick")
			action = {
				action: "pick",
				mapGuid: String(form.get("mapGuid") ?? ""),
			};
		else if (actionName === "score") {
			const rawScore = Number(form.get("rawScore"));
			const reported = Number(form.get("modifiedScore"));
			action = {
				action: "score",
				roundGuid: String(form.get("roundGuid") ?? ""),
				rawScore,
				modifiedScore: Number.isInteger(reported) ? reported : rawScore,
				noFailTriggered: form.get("noFailTriggered") === "on",
				proMode: form.get("proMode") === "on",
				missCount: Number(form.get("missCount")),
				fullCombo: form.get("fullCombo") === "on",
			};
		} else if (actionName === "forfeit" || actionName === "disconnect")
			action = { action: actionName };
		else {
			notice = { success: false, message: "Unknown mock client action." };
			return;
		}
		await runMutation(
			() =>
				createApiClient(fetch, auth.token).mockClients.action({
					clientGuid,
					action,
				}),
			"Mock client updated.",
		);
	}
</script>

<PageMeta
	title="Mock clients"
	description="Run private CompCube matches as web-controlled clients."
	path="/admin/mock-clients" />
<PageHeader
	title="Mock clients"
	description="Pair your queued plugin with a web-controlled opponent and exercise the real match flow without changing ratings." />

<section class="page-shell page-section mock-page">
	<nav class="admin-nav">
		<a href="/admin/reports"><i class="pi pi-flag"></i>Reports</a><a
			href="/admin/users"><i class="pi pi-users"></i>Users</a
		><a href="/admin/competition"
			><i class="pi pi-sliders-h"></i>Competition</a
		><a class="active" href="/admin/mock-clients"
			><i class="pi pi-desktop"></i>Mock clients</a>
	</nav>
	<form onsubmit={createMatch} class="surface create">
		<div>
			<p class="eyebrow">Plugin vs mock</p>
			<h2>Create solo test match</h2>
			<p class="create-copy">
				Join a queue in the plugin first, then choose the profile the
				browser-controlled opponent should emulate.
			</p>
		</div>
		<div class:ready={Boolean(data.queued)} class="queue-state">
			<i class={data.queued ? "pi pi-check-circle" : "pi pi-clock"}></i
			><span
				>{#if data.queued}<small>PLUGIN WAITING IN</small><strong
						>{data.queued.queue?.name ?? "Queue"}</strong
					>{:else}<small>PLUGIN NOT QUEUED</small><strong
						>Join from Beat Saber first</strong
					>{/if}</span>
		</div>
		<label
			>Mock opponent platform ID<input
				name="mockPlatformId"
				required
				inputmode="numeric" /></label>
		<Button type="submit" disabled={submitting}
			><i class="pi pi-play"></i>Pair with plugin</Button>
	</form>
	{#if notice}<p class:success={notice.success} class="notice">
			{notice.message}
		</p>{/if}

	<div class="matches">
		{#each matches as match (match.guid)}
			<article class="surface match-card">
				<header>
					<div>
						<p class="eyebrow">
							Plugin vs mock · round {match.currentRound}
						</p>
						<h2>{match.status.replaceAll("_", " ")}</h2>
					</div>
					{#if activeTimer(match)}<div
							class:urgent={remaining(match) <= 10}
							class="countdown">
							<NumberFlow value={remaining(match)} /><small
								>SECONDS · {activeTimer(match)?.kind}</small>
						</div>{/if}
					<a href={`/matches/${match.guid}`}
						><i class="pi pi-external-link"></i>Full match view</a>
				</header>
				<div class="clients">
					{#each competitors(match) as player}
						{@const client = clientFor(match, player.userGuid)}
						<section
							class="client"
							class:offline={client
								? !client.connected
								: !player.connected}>
							<div class="identity">
								<span class={player.role}>{player.role}</span>
								<div>
									<strong>{player.user?.username}</strong
									><small class="numeric"
										>{player.user?.platformId} · {client
											? "MOCK CLIENT"
											: "PLUGIN CLIENT"}</small>
								</div>
								<b class="numeric"
									>{player.health.toFixed(3)} HP</b>
							</div>
							<div class="mmr">
								<span
									>{player.initialMmr.toLocaleString()} MMR</span
								>{#if player.finalMmr !== null}<strong
										class:gain={player.finalMmr >=
											player.initialMmr}
										class:loss={player.finalMmr <
											player.initialMmr}
										>{player.finalMmr >= player.initialMmr
											? "+"
											: ""}{player.finalMmr -
											player.initialMmr} simulated</strong
									>{:else}<small
										>Result changes are simulated</small
									>{/if}
							</div>
							{#if client}
								{#if match.status === "awaiting_discards"}
									<form onsubmit={act} class="action">
										<input
											type="hidden"
											name="clientGuid"
											value={client.guid} /><input
											type="hidden"
											name="actionName"
											value="discard" />
										<div class="cards">
											{#each hand(match, player.userGuid)?.maps?.filter((card) => card.active) ?? [] as card}<label
													><input
														type="checkbox"
														name="mapGuids"
														value={card.mapGuid} /><span
														>{card.map?.name}</span
													></label
												>{/each}
										</div>
										<Button
											type="submit"
											size="small"
											disabled={submitting}
											>Submit discards</Button>
									</form>
								{:else if match.status === "awaiting_pick" && ((match.currentRound + 1) % 2 === 1 ? player.role === "red" : player.role === "blue")}
									<div class="cards picks">
										{#each hand(match, player.userGuid)?.maps?.filter((card) => card.active) ?? [] as card}<form
												onsubmit={act}>
												<input
													type="hidden"
													name="clientGuid"
													value={client.guid} /><input
													type="hidden"
													name="actionName"
													value="pick" /><input
													type="hidden"
													name="mapGuid"
													value={card.mapGuid} /><button
													disabled={submitting}
													>{card.map?.name}<small
														>{card.map?.difficulty} ·
														{card.map?.modifiers.join(
															" + ",
														)}</small
													></button>
											</form>{/each}
									</div>
								{:else if match.status === "awaiting_scores" && currentRound(match)}
									<form onsubmit={act} class="score-form">
										<input
											type="hidden"
											name="clientGuid"
											value={client.guid} /><input
											type="hidden"
											name="actionName"
											value="score" /><input
											type="hidden"
											name="roundGuid"
											value={currentRound(match)
												?.guid} /><label
											>Raw score<input
												type="number"
												min="0"
												max={currentRound(match)?.map
													?.maxScore}
												name="rawScore"
												value={Math.floor(
													(currentRound(match)?.map
														?.maxScore ?? 0) * 0.9,
												)}
												required /></label
										><label
											>Displayed score<input
												type="number"
												min="0"
												name="modifiedScore"
												value={Math.floor(
													(currentRound(match)?.map
														?.maxScore ?? 0) * 0.9,
												)}
												required /></label
										><label
											>Misses<input
												type="number"
												min="0"
												name="missCount"
												value="0"
												required /></label
										><label class="check"
											><input
												type="checkbox"
												name="fullCombo"
												checked />FC</label
										><Button
											type="submit"
											size="small"
											disabled={submitting}
											>Submit score</Button>
									</form>
								{:else}<p class="waiting">
										Waiting for the plugin or server timer.
									</p>{/if}
								{#if !["countdown", "playing", "awaiting_scores", "completed", "aborted"].includes(match.status)}<div
										class="danger-actions">
										<form onsubmit={act}>
											<input
												type="hidden"
												name="clientGuid"
												value={client.guid} /><input
												type="hidden"
												name="actionName"
												value="forfeit" /><button
												disabled={submitting}
												><i class="pi pi-flag"></i
												>Forfeit</button>
										</form>
										<form onsubmit={act}>
											<input
												type="hidden"
												name="clientGuid"
												value={client.guid} /><input
												type="hidden"
												name="actionName"
												value="disconnect" /><button
												disabled={submitting}
												><i class="pi pi-power-off"></i
												>Crash client</button>
										</form>
									</div>{/if}
							{:else}<p class="waiting plugin-waiting">
									<i class="pi pi-wifi"></i>Controlled by the
									real plugin. Continue this side in Beat
									Saber.
								</p>{/if}
						</section>
					{/each}
				</div>
			</article>
		{:else}<p class="empty-state surface">No mock matches yet.</p>{/each}
	</div>
</section>

<style>
	.mock-page {
		padding-top: 2rem;
	}
	.admin-nav {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}
	.admin-nav a {
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
	.create {
		display: grid;
		grid-template-columns: minmax(16rem, 1.4fr) minmax(11rem, 0.7fr) minmax(
				12rem,
				0.8fr
			) auto;
		align-items: end;
		gap: 0.8rem;
		padding: 1rem;
	}
	.create h2 {
		margin: 0.2rem 0;
	}
	.create-copy {
		max-width: 38rem;
		margin: 0.35rem 0 0;
		color: var(--text-subtle);
		font-size: 0.75rem;
	}
	.create label,
	.score-form label {
		display: grid;
		gap: 0.25rem;
		color: var(--text-muted);
		font: 600 0.68rem var(--font-secondary);
	}
	input {
		padding: 0.58rem;
		border: 1px solid var(--border);
		border-radius: 0.35rem;
		background: var(--background);
		color: var(--text);
	}
	.queue-state {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 2.5rem;
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 0.35rem;
		color: var(--text-subtle);
	}
	.queue-state.ready {
		border-color: rgba(75, 205, 142, 0.35);
		color: var(--success);
	}
	.queue-state span {
		display: grid;
	}
	.queue-state small {
		font: 700 0.55rem var(--font-secondary);
		letter-spacing: 0.08em;
	}
	.queue-state strong {
		color: var(--text);
		font-size: 0.75rem;
	}
	.eyebrow {
		margin: 0;
		color: var(--purple);
		font: 700 0.64rem var(--font-secondary);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.notice {
		padding: 0.8rem;
		color: var(--danger);
	}
	.notice.success {
		color: var(--success);
	}
	.matches {
		display: grid;
		gap: 1rem;
		margin-top: 1rem;
	}
	.match-card {
		padding: 1rem;
	}
	.match-card > header {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}
	.match-card h2 {
		margin: 0.2rem 0;
		text-transform: capitalize;
	}
	.match-card header > a {
		color: var(--text-muted);
		font: 600 0.7rem var(--font-secondary);
		text-decoration: none;
	}
	.countdown {
		display: grid;
		justify-items: end;
		color: var(--text);
		font: 700 2rem var(--font-secondary);
		font-variant-numeric: tabular-nums;
	}
	.countdown small {
		color: var(--text-subtle);
		font-size: 0.55rem;
	}
	.countdown.urgent {
		animation: heartbeat 0.75s ease-in-out infinite;
		color: var(--danger);
	}
	@keyframes heartbeat {
		0%,
		100% {
			color: var(--danger);
			transform: scale(1);
		}
		50% {
			color: #fff;
			transform: scale(1.06);
		}
	}
	.clients {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.8rem;
		padding-top: 1rem;
	}
	.client {
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: var(--background-soft);
	}
	.client.offline {
		opacity: 0.55;
	}
	.identity {
		display: grid;
		grid-template-columns: 2.4rem 1fr auto;
		align-items: center;
		gap: 0.7rem;
		margin-bottom: 0.55rem;
	}
	.identity > span {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 50%;
		font: 800 0.65rem var(--font-secondary);
		text-transform: uppercase;
	}
	.identity > span.red {
		background: rgba(255, 75, 91, 0.15);
		color: var(--red);
	}
	.identity > span.blue {
		background: rgba(72, 128, 255, 0.15);
		color: var(--blue);
	}
	.identity > div {
		display: grid;
	}
	.identity small {
		color: var(--text-subtle);
	}
	.mmr {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin: 0 0 1rem 3.1rem;
		color: var(--text-muted);
		font: 600 0.68rem var(--font-secondary);
	}
	.mmr small {
		color: var(--text-subtle);
	}
	.mmr .gain {
		color: var(--success);
	}
	.mmr .loss {
		color: var(--danger);
	}
	.plugin-waiting {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 4rem;
		padding: 0.8rem;
		border: 1px dashed var(--border);
		border-radius: 0.35rem;
	}
	.cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem;
		margin-bottom: 0.7rem;
	}
	.cards label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem;
		border: 1px solid var(--border);
		border-radius: 0.3rem;
		font-size: 0.72rem;
	}
	.picks form button {
		width: 100%;
		height: 100%;
		padding: 0.55rem;
		border: 1px solid var(--border);
		border-radius: 0.3rem;
		background: var(--background);
		color: var(--text);
		text-align: left;
		cursor: pointer;
	}
	.picks button:hover {
		border-color: var(--purple);
	}
	.picks small {
		display: block;
		color: var(--text-subtle);
	}
	.score-form {
		display: flex;
		align-items: end;
		flex-wrap: wrap;
		gap: 0.45rem;
	}
	.score-form label:not(.check) {
		flex: 1;
		min-width: 7rem;
	}
	.score-form .check {
		display: flex;
		align-items: center;
		padding: 0.5rem;
	}
	.waiting {
		color: var(--text-subtle);
		font-size: 0.75rem;
	}
	.danger-actions {
		display: flex;
		gap: 0.4rem;
		margin-top: 1rem;
		padding-top: 0.7rem;
		border-top: 1px solid var(--border);
	}
	.danger-actions button {
		border: 0;
		background: none;
		color: var(--danger);
		font: 600 0.68rem var(--font-secondary);
		cursor: pointer;
	}
	@media (max-width: 1000px) {
		.create {
			grid-template-columns: 1fr 1fr;
		}
		.create > div {
			grid-column: 1/-1;
		}
		.clients {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 600px) {
		.create {
			grid-template-columns: 1fr;
		}
		.match-card > header {
			grid-template-columns: 1fr auto;
		}
		.match-card header > a {
			grid-column: 1/-1;
		}
		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>
