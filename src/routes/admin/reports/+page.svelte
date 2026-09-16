<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import { createApiClient } from "$lib/api";
	import { useAuth } from "$lib/auth.svelte";
	import Button from "$lib/components/Button.svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	import { parseResponse, type Report } from "compcube-client";

	let { data } = $props();
	const auth = useAuth();
	let submitting = $state(false);
	let notice = $state<{ success: boolean; message: string } | null>(null);

	function client() {
		return createApiClient(fetch, auth.token);
	}

	async function runMutation(request: () => Promise<Response>, success: string) {
		submitting = true;
		notice = null;
		try {
			await parseResponse(await request());
			notice = { success: true, message: success };
			await invalidateAll();
		} catch (error) {
			notice = {
				success: false,
				message: error instanceof Error ? error.message : "The moderation action failed.",
			};
		} finally {
			submitting = false;
		}
	}

	async function resolve(report: Report) {
		await runMutation(
			() => client().reports.resolve({ reportGuid: report.guid }),
			"Report resolved.",
		);
	}

	async function timeout(event: SubmitEvent, report: Report) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		await runMutation(
			() => client().moderation.timeout({
				userGuid: report.targetUserGuid,
				durationMinutes: Number(form.get("durationMinutes")),
				reason: String(form.get("reason") ?? "").trim(),
			}),
			`Timeout applied to ${report.target?.username ?? "the player"}.`,
		);
	}

	async function ban(event: SubmitEvent, report: Report) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		await runMutation(
			() => client().moderation.ban({
				userGuid: report.targetUserGuid,
				reason: String(form.get("reason") ?? "").trim(),
			}),
			`${report.target?.username ?? "Player"} was banned.`,
		);
	}
</script>

<PageMeta title="Player reports" description="Review and resolve CompCube player reports." path="/admin/reports" />
<PageHeader title="Player reports" description="Review player-submitted context, apply account actions, and resolve the moderation queue." />

<section class="page-shell page-section reports-page">
	<nav class="admin-nav" aria-label="Administration">
		<a class="active" href="/admin/reports"><i class="pi pi-flag"></i>Reports</a>
		{#if data.isAdmin}<a href="/admin/users"><i class="pi pi-users"></i>Users</a><a href="/admin/competition"><i class="pi pi-sliders-h"></i>Competition</a>{/if}
		{#if data.isDeveloper}<a href="/admin/mock-clients"><i class="pi pi-desktop"></i>Mock clients</a>{/if}
	</nav>

	<div class="toolbar">
		<div class="filters" aria-label="Report status">
			{#each ["unresolved", "resolved", "all"] as filter}
				<a href={`?filter=${filter}`} class:active={data.filter === filter}>{filter}</a>
			{/each}
		</div>
		<strong class="numeric">{data.reports.length} REPORTS</strong>
	</div>

	{#if notice}<p class="notice" class:success={notice.success}>{notice.message}</p>{/if}

	<div class="reports">
		{#each data.reports as report (report.guid)}
			<article class="surface" class:resolved={report.resolved}>
				<header>
					<div class="status"><i class={`pi ${report.resolved ? "pi-check-circle" : "pi-flag"}`}></i>{report.resolved ? "Resolved" : "Needs review"}</div>
					<time>{new Date(report.createdAt).toLocaleString()}</time>
				</header>
				<div class="people">
					<div><small>Reported player</small><a href={`/users/${report.targetUserGuid}`}>{report.target?.username ?? report.targetUserGuid}</a></div>
					<i class="pi pi-arrow-left"></i>
					<div><small>Reported by</small><a href={`/users/${report.senderUserGuid}`}>{report.sender?.username ?? report.senderUserGuid}</a></div>
				</div>
				<blockquote>{report.reason || "No reason supplied."}</blockquote>
				<div class="context">
					<span><i class={`pi ${report.reportSource === "plugin" ? "pi-desktop" : "pi-globe"}`}></i>{report.reportSource}</span>
					{#if report.matchGuid}<a href={`/matches/${report.matchGuid}`}><i class="pi pi-external-link"></i>Open associated match</a>{:else}<span>No match attached</span>{/if}
					<code>{report.guid}</code>
				</div>

				<div class="actions">
					{#if !report.resolved}<Button size="small" onclick={() => void resolve(report)} disabled={submitting}><i class="pi pi-check"></i>Resolve</Button>{/if}
					<details>
						<summary>Timeout player</summary>
						<form onsubmit={(event) => timeout(event, report)}>
							<select name="durationMinutes" required>
								<option value="15">15 minutes</option><option value="60">1 hour</option><option value="1440">1 day</option><option value="10080">7 days</option>
							</select>
							<input name="reason" required placeholder="Moderation reason" />
							<Button type="submit" size="small" variant="secondary" disabled={submitting}>Apply timeout</Button>
						</form>
					</details>
					{#if !report.target?.banned}<details>
						<summary>Ban player</summary>
						<form onsubmit={(event) => ban(event, report)}>
							<input name="reason" required placeholder="Ban reason" />
							<Button type="submit" size="small" variant="danger" disabled={submitting}>Confirm ban</Button>
						</form>
					</details>{:else}<span class="banned"><i class="pi pi-ban"></i>Player banned</span>{/if}
				</div>
			</article>
		{:else}
			<p class="empty-state surface">There are no {data.filter === "all" ? "" : data.filter} reports.</p>
		{/each}
	</div>
</section>

<style>
	.reports-page{padding-top:2rem}.admin-nav,.filters{display:flex;flex-wrap:wrap;gap:.5rem}.admin-nav{margin-bottom:1.5rem}.admin-nav a,.filters a{display:flex;align-items:center;gap:.45rem;padding:.5rem .7rem;border:1px solid var(--border);border-radius:.35rem;color:var(--text-muted);font:600 .75rem var(--font-secondary);text-decoration:none}.admin-nav a.active,.filters a.active{border-color:var(--purple);color:var(--text)}
	.toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}.toolbar>strong{color:var(--text-subtle);font-size:.7rem}
	.notice{padding:.8rem;border-left:2px solid var(--danger);background:rgba(255,109,121,.08)}.notice.success{color:var(--success);border-color:var(--success)}
	.reports{display:grid;gap:.75rem}.reports article{padding:1rem;border-left:2px solid var(--danger)}.reports article.resolved{border-left-color:var(--success);opacity:.78}
	header,.context,.actions{display:flex;align-items:center;justify-content:space-between;gap:1rem}header{padding-bottom:.8rem;border-bottom:1px solid var(--border)}header time,.context{color:var(--text-subtle);font:600 .65rem var(--font-secondary)}.status{color:var(--danger);font:700 .72rem var(--font-secondary);text-transform:uppercase}.resolved .status{color:var(--success)}.status i{margin-right:.4rem}
	.people{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1rem;padding:1rem 0}.people div{display:grid}.people div:last-child{text-align:right}.people small{color:var(--text-subtle);font:600 .62rem var(--font-secondary);text-transform:uppercase}.people a{color:var(--text);font:700 1rem var(--font-secondary);text-decoration:none}.people>i{color:var(--text-subtle)}
	blockquote{padding:.9rem;margin:0 0 1rem;border-left:2px solid var(--purple);background:var(--background);color:var(--text-muted)}.context{justify-content:flex-start;flex-wrap:wrap}.context span,.context a{display:flex;align-items:center;gap:.35rem;color:var(--text-subtle);text-decoration:none}.context code{margin-left:auto}
	.actions{justify-content:flex-start;align-items:flex-start;flex-wrap:wrap;padding-top:1rem;margin-top:1rem;border-top:1px solid var(--border)}details{position:relative}summary,.banned{padding:.55rem .7rem;color:var(--text-muted);font:600 .75rem var(--font-secondary);cursor:pointer}.banned{color:var(--danger)}details form{display:grid;grid-template-columns:auto minmax(12rem,1fr) auto;gap:.5rem;position:absolute;z-index:2;top:calc(100% + .35rem);left:0;min-width:31rem;padding:.7rem;border:1px solid var(--border-strong);border-radius:.4rem;background:var(--surface)}details input,details select{padding:.55rem;border:1px solid var(--border);border-radius:.3rem;background:var(--background);color:var(--text)}
	@media(max-width:700px){.toolbar{align-items:flex-start;flex-direction:column}.people{grid-template-columns:1fr}.people>i{display:none}.people div:last-child{text-align:left}.context code{width:100%;overflow:hidden}.actions{display:grid}details form{position:static;grid-template-columns:1fr;min-width:0;margin-top:.4rem}}
</style>
