<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import { createApiClient } from "$lib/api";
	import { useAuth } from "$lib/auth.svelte";
	import Button from "$lib/components/Button.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	import ReportForm from "$lib/components/ReportForm.svelte";
	import UserProfile from "$lib/components/UserProfile.svelte";
	let { data } = $props();
	const auth = useAuth();
	let moderationOpen = $state(false);
	let notice = $state<{ success: boolean; message: string } | null>(null);
	let submitting = $state(false);

	async function runMutation(
		request: () => Promise<Response>,
		message: string,
	) {
		submitting = true;
		try {
			const response = await request();
			if (!response.ok)
				throw new Error("The moderation action was rejected.");
			notice = { success: true, message };
			moderationOpen = false;
			await invalidateAll();
		} catch (error) {
			notice = {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "The moderation action was rejected.",
			};
		} finally {
			submitting = false;
		}
	}

	function client() {
		return createApiClient(fetch, auth.token);
	}

	async function ban(event: SubmitEvent) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		const reason = String(form.get("reason") ?? "").trim();
		if (!reason) return;
		await runMutation(
			() => client().moderation.ban({ userGuid: data.user.guid, reason }),
			"User banned.",
		);
	}

	async function timeout(event: SubmitEvent) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		const reason = String(form.get("reason") ?? "").trim();
		const preset = Number(
			(event.submitter as HTMLButtonElement | null)?.value,
		);
		const endsAt = String(form.get("endsAt") ?? "").trim();
		if (!reason || (!endsAt && (!Number.isInteger(preset) || preset < 1))) {
			notice = {
				success: false,
				message: "Choose a timeout duration and enter a reason.",
			};
			return;
		}
		await runMutation(
			() =>
				client().moderation.timeout({
					userGuid: data.user.guid,
					reason,
					durationMinutes: endsAt ? undefined : preset,
					endsAt: endsAt ? new Date(endsAt) : undefined,
				}),
			"Timeout applied.",
		);
	}
</script>

<PageMeta
	title={data.user.username}
	description={`${data.user.username}'s CompCube rank, rating, match record, and win streak.`}
	path={`/users/${data.user.guid}`} />
<div class="page-shell">
	<UserProfile user={data.user} />
	<ReportForm
		targets={[data.user]}
		heading={`Report ${data.user.username}`}
		description="Report behavior involving this player. You can submit a report from their profile even when there is no associated match." />
</div>
{#if data.canModerate}
	<section class="page-shell moderation surface">
		<div>
			<p class="eyebrow">Moderation</p>
			<h2>Queue access</h2>
			<p>
				Permanent bans and temporary timeouts both prevent queueing and
				are rechecked by matchmaking.
			</p>
		</div>
		<Button variant="secondary" onclick={() => (moderationOpen = true)}
			><i class="pi pi-clock"></i>Timeout</Button>
		{#if data.user.banned}
			<form
				onsubmit={(event) => {
					event.preventDefault();
					void runMutation(
						() =>
							client().moderation.unban({
								userGuid: data.user.guid,
							}),
						"Ban removed.",
					);
				}}>
				<Button type="submit" disabled={submitting}
					><i class="pi pi-unlock"></i>Remove ban</Button>
			</form>
		{:else}
			<form onsubmit={ban} class="ban-form">
				<input name="reason" placeholder="Ban reason" required /><Button
					type="submit"
					variant="danger"
					disabled={submitting}><i class="pi pi-ban"></i>Ban</Button>
			</form>
		{/if}
		{#if data.user.moderationActions?.length}
			<form
				onsubmit={(event) => {
					event.preventDefault();
					void runMutation(
						() =>
							client().moderation.removeTimeouts({
								userGuid: data.user.guid,
							}),
						"Active timeout removed.",
					);
				}}>
				<Button type="submit" variant="ghost" disabled={submitting}
					><i class="pi pi-times"></i>Remove active timeout</Button>
			</form>
		{/if}
		{#if notice}<p class:success={notice.success} class="notice">
				{notice.message}
			</p>{/if}
		<div class="history">
			{#each data.timeoutHistory as timeout}
				<small
					>{timeout.reason} · {new Date(
						timeout.startsAt,
					).toLocaleString()} → {timeout.endsAt
						? new Date(timeout.endsAt).toLocaleString()
						: "Permanent"}{timeout.revokedAt
						? " · revoked"
						: ""}</small>
			{/each}
		</div>
	</section>
{/if}

{#if moderationOpen}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) =>
			event.target === event.currentTarget && (moderationOpen = false)}>
		<div
			class="timeout-modal surface"
			role="dialog"
			aria-modal="true"
			aria-labelledby="timeout-title">
			<button
				class="close"
				aria-label="Close"
				onclick={() => (moderationOpen = false)}
				><i class="pi pi-times"></i></button>
			<p class="eyebrow">Temporary ban</p>
			<h2 id="timeout-title">Timeout {data.user.username}</h2>
			<form onsubmit={timeout}>
				<label
					>Reason<input
						name="reason"
						required
						placeholder="Competitive integrity violation" /></label>
				<div class="presets">
					{#each [[10, "10 mins"], [30, "30 mins"], [60, "1 hour"], [1440, "1 day"], [10080, "1 week"]] as preset}
						<button
							type="submit"
							name="durationMinutes"
							value={preset[0]}>{preset[1]}</button>
					{/each}
				</div>
				<label
					>Custom end<input
						type="datetime-local"
						name="endsAt" /></label>
				<Button type="submit" variant="danger" disabled={submitting}
					>Apply custom timeout</Button>
			</form>
		</div>
	</div>
{/if}

<style>
	.moderation {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.7rem;
		padding: 1.2rem;
		margin-bottom: 4rem;
	}
	.moderation > div:first-child {
		flex: 1;
		min-width: 18rem;
	}
	.moderation h2,
	.moderation p {
		margin: 0.2rem 0;
	}
	.moderation p {
		color: var(--text-muted);
		font-size: 0.8rem;
	}
	.eyebrow {
		color: var(--purple);
		font: 700 0.66rem var(--font-secondary);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.ban-form {
		display: flex;
		gap: 0.5rem;
	}
	input {
		padding: 0.6rem;
		border: 1px solid var(--border);
		border-radius: 0.35rem;
		background: var(--background);
		color: var(--text);
	}
	.notice {
		flex-basis: 100%;
		color: var(--danger);
	}
	.notice.success {
		color: var(--success);
	}
	.history {
		flex-basis: 100%;
		display: grid;
		gap: 0.25rem;
		color: var(--text-subtle);
	}
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(8px);
	}
	.timeout-modal {
		position: relative;
		width: min(34rem, 100%);
		padding: 1.5rem;
		animation: enter 0.18s ease;
	}
	.timeout-modal h2 {
		margin: 0.25rem 0 1rem;
	}
	.timeout-modal form,
	.timeout-modal label {
		display: grid;
		gap: 0.6rem;
	}
	.timeout-modal label {
		color: var(--text-muted);
		font: 600 0.72rem var(--font-secondary);
	}
	.presets {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.4rem;
	}
	.presets button,
	.close {
		border: 1px solid var(--border);
		background: var(--background);
		color: var(--text);
		cursor: pointer;
	}
	.presets button {
		padding: 0.65rem 0.3rem;
		border-radius: 0.35rem;
	}
	.presets button:hover {
		border-color: var(--purple);
	}
	.close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
	}
	@keyframes enter {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
	}
	@media (max-width: 600px) {
		.presets {
			grid-template-columns: 1fr 1fr;
		}
		.ban-form {
			width: 100%;
		}
		.ban-form input {
			min-width: 0;
			flex: 1;
		}
	}
</style>
