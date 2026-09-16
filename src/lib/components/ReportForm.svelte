<script lang="ts">
	import { createApiClient } from "$lib/api";
	import { useAuth } from "$lib/auth.svelte";
	import { parseResponse, type User } from "compcube-client";
	import Button from "./Button.svelte";

	let {
		targets,
		associatedMatchGuid,
		heading = "Report a player",
		description = "Give the moderation team a clear description of what happened.",
	}: {
		targets: Array<Pick<User, "guid" | "username">>;
		associatedMatchGuid?: string;
		heading?: string;
		description?: string;
	} = $props();

	const auth = useAuth();
	let submitting = $state(false);
	let submitted = $state(false);
	let notice = $state<{ success: boolean; message: string } | null>(null);
	const reportableTargets = $derived(
		targets.filter((target) => target.guid !== auth.profile?.guid),
	);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		const targetUserGuid = String(form.get("targetUserGuid") ?? "");
		const reason = String(form.get("reason") ?? "").trim();
		if (!targetUserGuid || !reason) {
			notice = { success: false, message: "Choose a player and enter a reason." };
			return;
		}
		submitting = true;
		notice = null;
		try {
			await parseResponse(await createApiClient(fetch, auth.token).reports.create({
				targetUserGuid,
				reason,
				source: "website",
				associatedMatchGuid,
			}));
			submitted = true;
			notice = { success: true, message: "Report submitted for moderator review." };
		} catch (error) {
			notice = {
				success: false,
				message: error instanceof Error ? error.message : "The report could not be submitted.",
			};
		} finally {
			submitting = false;
		}
	}
</script>

{#if reportableTargets.length}
	<section class="report surface">
		<div class="intro">
			<p class="eyebrow">Player safety</p>
			<h2>{heading}</h2>
			<p>{description}</p>
		</div>
		{#if submitted}
			<p class="confirmation"><i class="pi pi-check-circle"></i>{notice?.message}</p>
		{:else if !auth.isAuthenticated}
			<div class="login">
				<p>You must be logged in to submit a report.</p>
				<Button onclick={() => auth.login()}><i class="pi pi-sign-in"></i>Log in to report</Button>
			</div>
		{:else}
			<form onsubmit={submit}>
				{#if reportableTargets.length === 1}
					<input type="hidden" name="targetUserGuid" value={reportableTargets[0].guid} />
					<p class="target">Reporting <strong>{reportableTargets[0].username}</strong></p>
			{:else}
					<label>Player
						<select name="targetUserGuid" required>
							<option value="" disabled selected>Select a player</option>
							{#each reportableTargets as target}<option value={target.guid}>{target.username}</option>{/each}
						</select>
					</label>
			{/if}
				<label>Reason
					<textarea name="reason" rows="4" required placeholder="Describe what happened. Include relevant behavior and context."></textarea>
				</label>
				<div class="actions">
					<small>{associatedMatchGuid ? "This match will be attached as context." : "Reports are private and visible only to moderators."}</small>
					<Button type="submit" variant="danger" disabled={submitting} loading={submitting}><i class="pi pi-flag"></i>Submit report</Button>
				</div>
				{#if notice && !notice.success}<p class="notice">{notice.message}</p>{/if}
			</form>
		{/if}
	</section>
{/if}

<style>
	.report { display:grid;grid-template-columns:minmax(13rem,.75fr) minmax(18rem,1.25fr);gap:2rem;padding:1.25rem;border-color:rgba(240,78,100,.28) }
	.eyebrow{margin:0;color:var(--text-subtle);font:700 .66rem var(--font-secondary);letter-spacing:.1em;text-transform:uppercase}
	h2{margin:.25rem 0}.intro>p:last-child,.login p,small{color:var(--text-muted)}
	form,label,.login{display:grid;gap:.6rem}label{font:600 .75rem var(--font-secondary)}
	select,textarea{box-sizing:border-box;width:100%;padding:.7rem;border:1px solid var(--border);border-radius:.4rem;background:var(--background);color:var(--text);font:inherit}
	textarea{resize:vertical}select:focus,textarea:focus{outline:1px solid var(--red);border-color:var(--red)}
	.target{margin:0;color:var(--text-muted)}.target strong{color:var(--text)}
	.actions{display:flex;align-items:center;justify-content:space-between;gap:1rem}
	.notice,.confirmation{padding:.8rem;border-left:2px solid var(--danger);background:rgba(255,109,121,.08)}
	.confirmation{align-self:center;color:var(--success);border-color:var(--success);background:rgba(85,219,156,.08)}
	.confirmation i{margin-right:.5rem}
	@media(max-width:700px){.report{grid-template-columns:1fr}.actions{align-items:stretch;flex-direction:column}}
</style>
