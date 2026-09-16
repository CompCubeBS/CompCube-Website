<script lang="ts">
	import { browser } from "$app/environment";
	import { invalidateAll } from "$app/navigation";
	import { env } from "$env/dynamic/public";
	import NumberFlow from "@number-flow/svelte";
	import { createApiClient } from "$lib/api";
	import { useAuth } from "$lib/auth.svelte";
	import Button from "$lib/components/Button.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	import ReportForm from "$lib/components/ReportForm.svelte";
	import type { MatchAuditEvent, MatchParticipant } from "compcube-client";
	import { onMount } from "svelte";
	let { data } = $props();
	const auth = useAuth();
	let connected = $state(false);
	let now = $state(Date.now());
	let liveMessage = $state("Connecting to live match…");
	let notice = $state<{ success: boolean; message: string } | null>(null);
	let submitting = $state(false);
	const competitors = $derived(
		data.match.participants?.filter(
			(participant) => participant.role !== "spectator",
		) ?? [],
	);
	const red = $derived(
		competitors.find((participant) => participant.role === "red"),
	);
	const blue = $derived(
		competitors.find((participant) => participant.role === "blue"),
	);
	const reportTargets = $derived(
		competitors.flatMap((participant) => participant.user ? [participant.user] : []),
	);
	const rounds = $derived(
		[...(data.match.rounds ?? [])].sort(
			(a, b) => a.roundNumber - b.roundNumber,
		),
	);
	const currentRound = $derived(
		rounds.findLast((round) => !round.endedAt) ?? rounds.at(-1),
	);
	const actions = $derived(
		[...(data.match.mapActions ?? [])].sort(
			(a, b) =>
				new Date(a.createdAt).getTime() -
				new Date(b.createdAt).getTime(),
		),
	);
	const auditEvents = $derived(
		[...(data.match.auditEvents ?? [])].sort(
			(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
		),
	);
	const activeTimer = $derived(data.match.timers?.filter((timer) => ["scheduled", "processing", "paused"].includes(timer.status)).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0]);
	const remainingSeconds = $derived(activeTimer ? activeTimer.status === "paused" ? Math.max(0, Math.ceil((activeTimer.pausedRemainingMs ?? 0) / 1000)) : Math.max(0, Math.ceil((new Date(activeTimer.dueAt).getTime() - now) / 1000)) : 0);
	function name(participant?: MatchParticipant) {
		return participant?.user?.username ?? "Waiting for player";
	}
	function accuracy(value: number) {
		return `${(value * 100).toFixed(2)}%`;
	}
	function mapName(map: { name?: string } | null | undefined) {
		return map?.name ?? "Unknown map";
	}
	function eventMapGuids(event: MatchAuditEvent): string[] {
		const value = event.metadata.mapGuids;
		if (Array.isArray(value)) return value.filter((guid): guid is string => typeof guid === "string");
		return typeof event.metadata.mapGuid === "string" ? [event.metadata.mapGuid] : [];
	}
	function eventMapNames(event: MatchAuditEvent) {
		return eventMapGuids(event).map((guid) => actions.find((action) => action.mapGuid === guid)?.map?.name ?? "Unknown map");
	}
	function eventText(event: MatchAuditEvent) {
		const player = event.user?.username ?? "Player";
		const maps = eventMapNames(event);
		const count = maps.length;
		switch (event.eventType) {
			case "initial_hand_dealt": return `CompCube dealt ${player} an initial hand (${count} maps)`;
			case "discards_submitted":
				if (event.timerExpired) return `Discard timer expired — CompCube kept ${player}'s hand`;
				return count ? `${player} discarded ${count} ${count === 1 ? "map" : "maps"}: ${maps.join(", ")}` : `${player} kept the initial hand`;
			case "replacement_maps_dealt": return `CompCube dealt ${count} replacement ${count === 1 ? "map" : "maps"} to ${player}: ${maps.join(", ")}`;
			case "map_picked":
				return event.timerExpired ? `Pick timer expired — CompCube selected ${maps[0] ?? "a map"} for ${player}` : `${player} picked ${maps[0] ?? "a map"}`;
			case "score_submitted": return `${event.source === "server" ? "CompCube submitted" : `${player} submitted`} the round ${String(event.metadata.roundNumber ?? "")} score${event.source === "server" ? ` for ${player}` : ""}`;
			case "score_defaulted": return `Score timer expired — CompCube recorded a timeout score for ${player}`;
		}
	}
	function eventTitle(event: MatchAuditEvent) {
		const timing = event.elapsedMs === null ? "" : ` after ${(event.elapsedMs / 1000).toFixed(1)}s`;
		const remaining = event.remainingMs === null ? "" : ` with ${(event.remainingMs / 1000).toFixed(1)}s remaining`;
		if (event.timerExpired) return `Timer expired${timing}. CompCube performed this server action; it was not submitted by the player.`;
		return `${event.source === "server" ? "Server action" : "Player action"}${timing}${remaining}.`;
	}
	function eventIcon(event: MatchAuditEvent) {
		if (event.timerExpired) return "pi-clock";
		if (event.eventType === "discards_submitted") return "pi-times";
		if (event.eventType === "map_picked" || event.eventType === "score_submitted") return "pi-check";
		return "pi-clone";
	}
	function replayUrl(platformId: string) {
		const url = new URL(env.PUBLIC_REPLAY_VIEWER_URL || "https://view.replay.beatkhana.com");
		url.searchParams.set("liveSource", "cocu");
		url.searchParams.set("playerId", platformId);
		url.searchParams.set("qualityPreset", "broadcast");
		url.searchParams.set("autoplay", "true");
		return url.toString();
	}
	async function runMutation(request: () => Promise<Response>, success: string) {
		submitting = true;
		try {
			const response = await request();
			if (!response.ok) throw new Error("The match action was rejected.");
			notice = { success: true, message: success };
			await invalidateAll();
		} catch (error) {
			notice = { success: false, message: error instanceof Error ? error.message : "The match action was rejected." };
		} finally {
			submitting = false;
		}
	}
	function values(event: SubmitEvent) {
		event.preventDefault();
		return new FormData(event.currentTarget as HTMLFormElement);
	}
	async function abortMatch(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).moderation.abort({ matchGuid: data.match.guid, reason: String(form.get("reason") ?? "").trim() }), "Match cancelled.");
	}
	async function setHealth(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).moderation.decision({ matchGuid: data.match.guid, action: "set_health", targetUserGuid: String(form.get("userGuid") ?? ""), health: Number(form.get("health")), reason: "Administrative health correction" }), "Health corrected.");
	}
	async function adjustMmr(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).moderation.adjustResult({ matchGuid: data.match.guid, winnerMmrGain: Number(form.get("winnerMmrGain")), loserMmrLoss: Number(form.get("loserMmrLoss")) }), "Final MMR changes corrected.");
	}
	async function declareWinner(event: SubmitEvent) {
		const form = values(event);
		await runMutation(() => createApiClient(fetch, auth.token).moderation.decision({ matchGuid: data.match.guid, action: "declare_winner", winnerUserGuid: String(form.get("winnerUserGuid") ?? ""), winnerMmrGain: Number(form.get("winnerMmrGain")), loserMmrLoss: Number(form.get("loserMmrLoss")), reason: String(form.get("reason") ?? "").trim() }), "Winner and final MMR changes applied.");
	}

	onMount(() => {
		if (!browser) return;
		const clock = setInterval(() => (now = Date.now()), 100);
		const socket = createApiClient(fetch, auth.token).socket;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const refresh = () => {
			clearTimeout(timer);
			timer = setTimeout(() => void invalidateAll(), 180);
		};
		void socket
			.connect()
			.then(async () => {
				connected = true;
				liveMessage = "Live updates connected";
				for (const event of [
					"cardsUpdated",
					"pickPhaseStarted",
					"playerSelectedMap",
					"roundStarted",
					"startMap",
					"roundResults",
					"timerUpdated",
					"matchPaused",
					"matchResumed",
					"matchFinished",
				] as const)
					socket.on(event, refresh);
				await socket.emit("watchMatch", { matchGuid: data.match.guid });
			})
			.catch(() => {
				connected = false;
				liveMessage = "Live updates unavailable";
			});
		return () => {
			clearInterval(clock);
			clearTimeout(timer);
			socket.disconnect();
		};
	});
</script>

<PageMeta
	title={`${name(red)} vs ${name(blue)}`}
	description="Live CompCube match details, scores, picks, discards and health."
	path={`/matches/${data.match.guid}`} />
<section class="page-shell match-hero">
	<div class="status">
		<span class:connected
			><i class="pi pi-circle-fill"></i>{liveMessage}</span
		><code>{data.match.guid}</code>
	</div>
	{#if data.match.isMock}<div class="mock-banner"><i class="pi pi-desktop"></i>Private mock match · excluded from public history and ratings</div>{/if}
	<div class="scoreboard">
		<div class="player red">
			<span>RED · PICKS FIRST</span>
			<h1>{name(red)}</h1>
			<div class="health">
				<i
					style={`width:${Math.min(100, Math.max(0, ((red?.health ?? 0) / data.match.startingHealth) * 100))}%`}
				></i>
			</div>
			<strong class="numeric">{(red?.health ?? 0).toFixed(3)} HP</strong>
		</div>
		<div class="center">
			<span>{data.match.status.replaceAll("_", " ")}</span><strong
				class="numeric">{data.match.currentRound}</strong
			><small>ROUND</small>
		</div>
		<div class="player blue">
			<span>BLUE</span>
			<h1>{name(blue)}</h1>
			<div class="health">
				<i
					style={`width:${Math.min(100, Math.max(0, ((blue?.health ?? 0) / data.match.startingHealth) * 100))}%`}
				></i>
			</div>
			<strong class="numeric">{(blue?.health ?? 0).toFixed(3)} HP</strong>
		</div>
	</div>
	{#if data.match.winner}<div class="winner">
			<i class="pi pi-trophy"></i>{data.match.winner.username} won · {data
				.match.outcomeKind}
		</div>{:else if data.match.outcomeKind === "draw"}<div class="winner">
			<i class="pi pi-equals"></i>Draw
		</div>{/if}
</section>

<section class="page-shell current-grid">
	<article class="current surface">
		<p class="eyebrow">
			{currentRound?.endedAt ? "Last played" : "Currently playing"}
		</p>
		{#if currentRound?.map}<div class="map">
				<img src={currentRound.map.imageUrl ?? ""} alt="" />
				<div>
					<h2>{mapName(currentRound.map)}</h2>
					<p>
						{currentRound.map.characteristic} · {currentRound.map
							.difficulty} · {currentRound.map.modifiers.join(
							" + ",
						)}
					</p>
					<span class="numeric"
						>MAX {currentRound.map.maxScore.toLocaleString()}</span>
				</div>
			</div>{:else}<p class="empty-state">Waiting for a map pick.</p>{/if}
	</article>
	<article class="surface phase">
		<p class="eyebrow">Match state</p>
		<h2>{data.match.status.replaceAll("_", " ")}</h2>
		{#if activeTimer}<div class:urgent={remainingSeconds <= 10} class="phase-countdown"><NumberFlow value={remainingSeconds} /><small>{activeTimer.kind.replaceAll("_", " ")} seconds remaining</small></div>{/if}
		<dl>
			<div>
				<dt>Competitive</dt>
				<dd>{data.match.competitive ? "Yes" : "No"}</dd>
			</div>
			<div>
				<dt>Started</dt>
				<dd>
					{data.match.startedAt
						? new Date(data.match.startedAt).toLocaleString()
						: "Not yet"}
				</dd>
			</div>
			<div>
				<dt>MMR change</dt>
				<dd class="numeric">
					+{data.match.winnerMmrGain ?? 0} / −{data.match
						.loserMmrLoss ?? 0}
				</dd>
			</div>
		</dl>
	</article>
	{#if data.canModerate}<article class="surface admin">
			<p class="eyebrow">Match control</p>
			<div class="admin-actions">
				{#if data.match.status === "paused"}<form onsubmit={(event) => { event.preventDefault(); void runMutation(() => createApiClient(fetch, auth.token).moderation.resume({ matchGuid: data.match.guid }), "Match resumed."); }}>
						<Button type="submit" disabled={submitting}
							><i class="pi pi-play"></i>Resume</Button>
					</form>{:else}<form onsubmit={(event) => { event.preventDefault(); void runMutation(() => createApiClient(fetch, auth.token).moderation.pause({ matchGuid: data.match.guid }), "Match paused."); }}>
						<Button type="submit" variant="secondary" disabled={submitting}
							><i class="pi pi-pause"></i>Pause</Button>
					</form>{/if}
				<form onsubmit={abortMatch}>
					<input
						name="reason"
						placeholder="Cancellation reason"
						required /><Button type="submit" variant="danger" disabled={submitting}
						><i class="pi pi-times"></i>Cancel</Button>
				</form>
			</div>
			{#each competitors as participant}<form
					onsubmit={setHealth}
					class="inline-form">
					<input
						type="hidden"
						name="userGuid"
						value={participant.userGuid} /><label
						>{name(participant)} health<input
							type="number"
							step="0.001"
							min="0"
							name="health"
							value={participant.health} /></label
					><Button type="submit" size="small" variant="secondary" disabled={submitting}
						>Set</Button>
				</form>{/each}
		</article>{/if}
	{#if data.isAdmin && data.match.status === "completed" && data.match.winnerUserGuid}<article
			class="surface admin">
			<p class="eyebrow">Final rating correction</p>
			<form onsubmit={adjustMmr} class="inline-form">
				<label
					>Winner gain<input
						type="number"
						min="0"
						name="winnerMmrGain"
						value={data.match.winnerMmrGain ?? 0} /></label
				><label
					>Loser loss<input
						type="number"
						min="0"
						name="loserMmrLoss"
						value={data.match.loserMmrLoss ?? 0} /></label
				><Button type="submit" size="small" disabled={submitting}>Apply</Button>
			</form>
			<form onsubmit={(event) => { event.preventDefault(); void runMutation(() => createApiClient(fetch, auth.token).moderation.undoResult({ matchGuid: data.match.guid }), "Match result reverted."); }}>
				<Button type="submit" variant="danger" size="small" disabled={submitting}
					><i class="pi pi-replay"></i>Revert result</Button>
			</form>
		</article>{/if}
	{#if data.isAdmin && !["completed", "aborted"].includes(data.match.status)}<article class="surface admin">
		<p class="eyebrow">Declare final result</p>
		<form onsubmit={declareWinner} class="winner-form">
			<label>Winner<select name="winnerUserGuid" required>{#each competitors as participant}<option value={participant.userGuid}>{name(participant)}</option>{/each}</select></label>
			<label>Winner gain<input type="number" min="0" name="winnerMmrGain" value="50" /></label>
			<label>Loser loss<input type="number" min="0" name="loserMmrLoss" value="50" /></label>
			<label class="reason">Reason<input name="reason" required placeholder="Administrative final decision" /></label>
			<Button type="submit" variant="danger" disabled={submitting}><i class="pi pi-gavel"></i>End match</Button>
		</form>
	</article>{/if}
	{#if notice}<p class="notice" class:success={notice.success}>
			{notice.message}
		</p>{/if}
</section>

<section class="page-shell report-section">
	<ReportForm
		targets={reportTargets}
		associatedMatchGuid={data.match.guid}
		heading="Report a player from this match"
		description="Participants and spectators can report a player. The match record will be attached for moderator context." />
</section>

{#if !["completed", "aborted"].includes(data.match.status) && red?.platformId && blue?.platformId}<section class="page-shell detail-section">
	<div class="section-title">
		<div><p class="eyebrow">Live replay stream</p><h2>Both player perspectives</h2></div>
		<span class="stream-state"><i class="pi pi-video"></i>Waiting or live</span>
	</div>
	<div class="replay-grid">
		<article class="surface"><header><strong>{name(red)}</strong><span>RED</span></header><iframe title={`${name(red)} live replay`} src={replayUrl(red.platformId)} allow="autoplay; fullscreen" loading="eager"></iframe></article>
		<article class="surface"><header><strong>{name(blue)}</strong><span>BLUE</span></header><iframe title={`${name(blue)} live replay`} src={replayUrl(blue.platformId)} allow="autoplay; fullscreen" loading="eager"></iframe></article>
	</div>
</section>{/if}

<section class="page-shell detail-section">
	<div class="section-title">
		<div>
			<p class="eyebrow">Complete record</p>
			<h2>Rounds & scores</h2>
		</div>
		<span class="numeric">{rounds.length} / 10</span>
	</div>
	<div class="rounds">
		{#each rounds as round}<article class="round surface">
				<header>
					<span class="numeric"
						>R{String(round.roundNumber).padStart(2, "0")}</span
					>
					<div>
						<h3>{mapName(round.map)}</h3>
						<p>
							Picked by {round.picker?.username ?? "Unknown"} · ×{round.damageMultiplier}
						</p>
					</div>
					{#if round.winner}<strong
							><i class="pi pi-trophy"></i>{round.winner
								.username}</strong
						>{:else}<strong>Draw</strong>{/if}
				</header>
				<div class="scores">
					{#each round.scores ?? [] as score}<div>
							<span
								>{competitors.find(
									(entry) =>
										entry.userGuid === score.userGuid,
								)?.user?.username ?? "Player"}</span
							><strong class="numeric"
								>{accuracy(score.accuracy)}</strong
							><small class="numeric"
								>{score.rawScore.toLocaleString()} / {score.maxScore.toLocaleString()} raw · {score.modifiedScore.toLocaleString()} modified</small
							><small
								>{score.missCount} misses {score.fullCombo
									? "· FC"
									: ""}
								{score.timedOut ? "· TIMEOUT" : ""}</small>
						</div>{/each}
				</div>
			</article>{:else}<p class="empty-state surface">
				No rounds have been played.
			</p>{/each}
	</div>
</section>

<section class="page-shell detail-section">
	<div class="section-title">
		<div>
			<p class="eyebrow">Draft record</p>
			<h2>Hands & match activity</h2>
		</div>
	</div>
	<div class="hands">
		{#each data.match.hands ?? [] as hand}<article class="surface">
				<h3>
					{competitors.find(
						(entry) => entry.userGuid === hand.userGuid,
					)?.user?.username ?? "Player"}
				</h3>
				{#each hand.maps ?? [] as card}<div
						class:inactive={!card.active}>
						<span>{mapName(card.map)}</span><small
							>{actions.findLast(
								(action) =>
									action.userGuid === hand.userGuid &&
									action.mapGuid === card.mapGuid,
							)?.action ??
								(card.active ? "available" : "used")}</small>
					</div>{/each}
			</article>{/each}
	</div>
	<ol class="timeline">
		{#each auditEvents as event}<li class:server-action={event.source === "server"} title={eventTitle(event)}>
				<time>{new Date(event.createdAt).toLocaleTimeString()}</time><i class={`pi ${eventIcon(event)}`}></i><span>{eventText(event)} <small>{event.source === "server" ? "SERVER" : "PLAYER"}</small></span>
			</li>{:else}
			{#each [...new Map(actions.map((action) => [`${action.createdAt}:${action.userGuid}:${action.action}`, action])).values()] as action}<li>
					<time>{new Date(action.createdAt).toLocaleTimeString()}</time><i class={`pi ${action.action === "picked" ? "pi-check" : action.action === "discarded" ? "pi-times" : "pi-clone"}`}></i><span><strong>{action.user?.username}</strong> {action.action} maps</span>
				</li>{/each}
		{/each}
	</ol>
</section>

<style>
	.match-hero {
		padding-block: 3rem 2rem;
	}
	.status {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		color: var(--text-subtle);
		font: 600 0.7rem var(--font-secondary);
	}
	.status span {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}
	.status span i {
		font-size: 0.45rem;
	}
	.status .connected {
		color: var(--success);
	}
	.mock-banner{margin-top:1rem;padding:.65rem;border:1px solid var(--purple);color:var(--purple);font:700 .7rem var(--font-secondary);text-align:center}.phase-countdown{display:grid;margin:.7rem 0;color:var(--text);font:700 2.2rem var(--font-secondary)}.phase-countdown small{color:var(--text-subtle);font-size:.6rem;text-transform:uppercase}.phase-countdown.urgent{animation:heartbeat .75s ease-in-out infinite}@keyframes heartbeat{0%,100%{color:var(--danger);transform:scale(1)}50%{color:#fff;transform:scale(1.025)}}
	.scoreboard {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: end;
		gap: 2rem;
		padding-block: 3rem;
	}
	.player > span,
	.eyebrow {
		margin: 0;
		color: var(--text-subtle);
		font: 700 0.66rem var(--font-secondary);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.player h1 {
		margin: 0.3rem 0 1rem;
		font-size: clamp(2rem, 5vw, 4.5rem);
	}
	.player.blue {
		text-align: right;
	}
	.player.red > span {
		color: var(--red);
	}
	.player.blue > span {
		color: var(--blue);
	}
	.health {
		height: 0.35rem;
		background: var(--border);
		overflow: hidden;
	}
	.health i {
		display: block;
		height: 100%;
		background: var(--red);
		transition: width 0.6s ease;
	}
	.blue .health i {
		margin-left: auto;
		background: var(--blue);
	}
	.player strong {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.72rem;
	}
	.center {
		display: grid;
		place-items: center;
		min-width: 7rem;
	}
	.center span {
		color: var(--purple);
		font: 700 0.66rem var(--font-secondary);
		text-transform: uppercase;
	}
	.center strong {
		font-size: 3rem;
	}
	.center small {
		color: var(--text-subtle);
	}
	.winner {
		padding: 0.8rem;
		border-block: 1px solid var(--border);
		text-align: center;
		color: var(--warning);
		font: 700 0.85rem var(--font-secondary);
	}
	.winner i {
		margin-right: 0.5rem;
	}
	.current-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 0.8rem;
		padding-block: 1rem 3rem;
	}
	.current-grid article {
		padding: 1.2rem;
	}
	.current {
		grid-row: span 2;
	}
	.map {
		display: grid;
		grid-template-columns: 8rem 1fr;
		align-items: center;
		gap: 1.2rem;
		margin-top: 1rem;
	}
	.map img {
		width: 8rem;
		height: 8rem;
		object-fit: cover;
		border-radius: 0.4rem;
		background: var(--background);
	}
	.map h2 {
		margin: 0 0 0.4rem;
	}
	.map p {
		color: var(--text-muted);
		font-size: 0.8rem;
	}
	.map span {
		color: var(--text-subtle);
		font-size: 0.7rem;
	}
	.phase h2 {
		text-transform: capitalize;
	}
	.phase dl {
		display: grid;
		gap: 0.5rem;
		margin: 0;
	}
	.phase dl div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font: 600 0.75rem var(--font-secondary);
	}
	dt {
		color: var(--text-subtle);
	}
	dd {
		margin: 0;
	}
	.admin-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 1rem 0;
	}
	.admin-actions form {
		display: flex;
		gap: 0.5rem;
	}
	.admin input,
	.inline-form input {
		padding: 0.55rem;
		border: 1px solid var(--border);
		border-radius: 0.35rem;
		background: var(--background);
		color: var(--text);
	}
	.inline-form {
		display: flex;
		align-items: end;
		gap: 0.5rem;
		margin-top: 0.65rem;
	}
	.inline-form label {
		display: grid;
		gap: 0.25rem;
		color: var(--text-muted);
		font: 600 0.68rem var(--font-secondary);
	}
	.winner-form{display:grid;grid-template-columns:1fr 7rem 7rem 1.5fr auto;align-items:end;gap:.5rem}.winner-form label{display:grid;gap:.25rem;color:var(--text-muted);font:600 .68rem var(--font-secondary)}.winner-form select{padding:.55rem;border:1px solid var(--border);border-radius:.35rem;background:var(--background);color:var(--text)}
	.notice {
		grid-column: 1/-1;
		padding: 0.8rem;
		border-left: 2px solid var(--danger);
		background: rgba(255, 109, 121, 0.08);
	}
	.notice.success {
		border-color: var(--success);
		color: var(--success);
	}
	.report-section {
		padding-block: 0 3rem;
	}
	.detail-section {
		padding-block: 3rem;
		border-top: 1px solid var(--border);
	}
	.stream-state { color: var(--success); font: 600 .7rem var(--font-secondary); }
	.stream-state i { margin-right: .35rem; }
	.replay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; }
	.replay-grid article { overflow: hidden; }
	.replay-grid header { display: flex; justify-content: space-between; padding: .75rem 1rem; font: 600 .72rem var(--font-secondary); }
	.replay-grid header span { color: var(--text-subtle); }
	.replay-grid iframe { display: block; width: 100%; aspect-ratio: 16/9; border: 0; background: #050508; }
	.section-title {
		display: flex;
		justify-content: space-between;
		align-items: end;
		margin-bottom: 1.2rem;
	}
	.section-title h2 {
		margin: 0.2rem 0 0;
	}
	.rounds {
		display: grid;
		gap: 0.7rem;
	}
	.round {
		overflow: hidden;
	}
	.round header {
		display: grid;
		grid-template-columns: 3rem 1fr auto;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-bottom: 1px solid var(--border);
	}
	.round header h3 {
		margin: 0;
		font: 700 1rem var(--font-secondary);
	}
	.round header p {
		margin: 0;
		color: var(--text-subtle);
		font-size: 0.72rem;
	}
	.round header strong {
		color: var(--warning);
		font: 600 0.72rem var(--font-secondary);
	}
	.scores {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}
	.scores > div {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.1rem 1rem;
		padding: 1rem;
	}
	.scores > div + div {
		border-left: 1px solid var(--border);
	}
	.scores span,
	.scores small {
		color: var(--text-muted);
		font-family: var(--font-secondary);
		font-size: 0.7rem;
	}
	.scores strong {
		font-size: 1.35rem;
	}
	.hands {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.8rem;
	}
	.hands article {
		padding: 1rem;
	}
	.hands h3 {
		margin-bottom: 0.75rem;
	}
	.hands article div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.55rem 0;
		border-top: 1px solid var(--border);
		font: 0.75rem var(--font-secondary);
	}
	.hands .inactive {
		color: var(--text-subtle);
		text-decoration: line-through;
	}
	.hands small {
		text-transform: uppercase;
	}
	.timeline {
		padding: 1.5rem 0 0;
		margin: 0;
		list-style: none;
	}
	.timeline li {
		display: grid;
		grid-template-columns: 6rem 1.5rem 1fr;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
		color: var(--text-muted);
		font: 0.75rem var(--font-secondary);
	}
	.timeline time {
		color: var(--text-subtle);
		font-size: 0.65rem;
	}
	.timeline i {
		color: var(--purple);
	}
	.timeline li.server-action i {
		color: var(--warning);
	}
	.timeline small {
		margin-left: 0.45rem;
		color: var(--text-subtle);
		font-size: 0.58rem;
		letter-spacing: 0.08em;
	}
	@media (max-width: 760px) {
		.scoreboard {
			grid-template-columns: 1fr 3rem 1fr;
			gap: 0.7rem;
		}
		.player h1 {
			font-size: 1.5rem;
		}
		.center {
			min-width: 0;
		}
		.center strong {
			font-size: 2rem;
		}
		.current-grid {
			grid-template-columns: 1fr;
		}
		.map {
			grid-template-columns: 5rem 1fr;
		}
		.map img {
			width: 5rem;
			height: 5rem;
		}
		.scores,
		.replay-grid,
		.hands {
			grid-template-columns: 1fr;
		}
		.scores > div + div {
			border-left: 0;
			border-top: 1px solid var(--border);
		}
	}
</style>
