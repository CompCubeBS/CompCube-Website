<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import { createApiClient } from "$lib/api";
	import { useAuth } from "$lib/auth.svelte";
	import Button from "$lib/components/Button.svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	import type { Permission, User } from "compcube-client";
	let { data } = $props();
	const auth = useAuth();
	let search = $state("");
	let expanded = $state<string | null>(null);
	let notice = $state<{ success: boolean; message: string } | null>(null);
	let submitting = $state(false);
	const permissions: Permission[] = [
		"role:admin",
		"role:dev",
		"role:pooler",
		"role:moderator",
		"role:player",
		"perk:supporter",
		"perk:contributor",
	];
	const visible = $derived(
		data.users.filter((user: User) =>
			`${user.username} ${user.platformId ?? ""} ${user.discordId ?? ""}`
				.toLowerCase()
				.includes(search.toLowerCase()),
		),
	);

	async function runMutation(request: () => Promise<Response>, success: string, failure: string) {
		submitting = true;
		try {
			const response = await request();
			if (!response.ok) throw new Error(failure);
			notice = { success: true, message: success };
			await invalidateAll();
		} catch (error) {
			notice = { success: false, message: error instanceof Error ? error.message : failure };
		} finally {
			submitting = false;
		}
	}

	async function updateUser(event: SubmitEvent) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		const selected = form.getAll("permissions").map(String).filter((permission): permission is Permission => permissions.includes(permission as Permission));
		await runMutation(() => createApiClient(fetch, auth.token).users.update({
			userGuid: String(form.get("userGuid") ?? ""),
			username: String(form.get("username") ?? "").trim(),
			avatarUrl: String(form.get("avatarUrl") ?? "").trim() || null,
			beatKhanaGuid: String(form.get("beatKhanaGuid") ?? "").trim() || null,
			discordId: String(form.get("discordId") ?? "").trim() || null,
			platformId: String(form.get("platformId") ?? "").trim() || null,
			banned: form.get("banned") === "on",
			permissions: selected.length ? selected : ["role:player"],
		}), "Account updated.", "The user could not be updated.");
	}

	async function updateMmr(event: SubmitEvent) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		const currentMmr = Number(form.get("currentMmr"));
		const startingMmr = Number(form.get("startingMmr"));
		if (!Number.isInteger(currentMmr) || currentMmr < 0 || !Number.isInteger(startingMmr) || startingMmr < 0) {
			notice = { success: false, message: "MMR values must be non-negative integers." };
			return;
		}
		await runMutation(() => createApiClient(fetch, auth.token).statistics.update({
			seasonGuid: String(form.get("seasonGuid") ?? ""),
			userGuid: String(form.get("userGuid") ?? ""),
			currentMmr,
			startingMmr,
		}), "Rating updated.", "The rating could not be updated.");
	}
</script>

<PageMeta
	title="User administration"
	description="Manage CompCube accounts, roles, bans and ratings."
	path="/admin/users" />
<PageHeader
	title="User administration"
	description="Search every account and change identity links, permissions, bans, and current-season MMR." />
<section class="page-shell page-section admin-page">
	<div class="admin-nav">
		<a class="active" href="/admin/users"
			><i class="pi pi-users"></i>Users</a
		><a href="/admin/competition"
			><i class="pi pi-sliders-h"></i>Competition</a
		><a href="/admin/mock-clients"
			><i class="pi pi-desktop"></i>Mock clients</a
		><a href="/matches"><i class="pi pi-eye"></i>Live matches</a>
	</div>
	<label class="search"
		><i class="pi pi-search"></i><input
			bind:value={search}
			placeholder="Search username, Discord ID or platform ID" /></label>
	{#if notice}<p class="notice" class:success={notice.success}>
			{notice.message}
		</p>{/if}
	<div class="users">
		{#each visible as user (user.guid)}{@const stats =
				user.competitiveStatistics?.[0]}
			<article class="surface" class:banned={user.banned}>
				<button
					class="user-summary"
					onclick={() =>
						(expanded = expanded === user.guid ? null : user.guid)}>
					<div class="avatar">
						{#if user.avatarUrl}<img
								src={user.avatarUrl}
								alt="" />{:else}<i class="pi pi-user"></i>{/if}
					</div>
					<div>
						<strong>{user.username}</strong><small class="numeric"
							>{user.platformId ?? "No platform ID"}</small>
					</div>
					<div class="permission-list">
						{#each user.permissions as permission}<span
								>{permission
									.replace("role:", "")
									.replace("perk:", "")}</span
							>{/each}{#if user.banned}<span class="ban"
								>BANNED</span
							>{/if}
					</div>
					<strong class="numeric mmr"
						>{stats?.currentMmr ?? "—"}<small>MMR</small></strong
					><i
						class={`pi ${expanded === user.guid ? "pi-chevron-up" : "pi-chevron-down"}`}
					></i>
				</button>
				{#if expanded === user.guid}<div class="editor">
						<form onsubmit={updateUser}>
							<input
								type="hidden"
								name="userGuid"
								value={user.guid} />
							<div class="fields">
								<label
									>Username<input
										name="username"
										value={user.username}
										required /></label
								><label
									>Platform ID<input
										name="platformId"
										value={user.platformId ?? ""} /></label
								><label
									>Discord ID<input
										name="discordId"
										value={user.discordId ?? ""} /></label
								><label
									>BeatKhana GUID<input
										name="beatKhanaGuid"
										value={user.beatKhanaGuid ??
											""} /></label
								><label class="wide"
									>Avatar URL<input
										name="avatarUrl"
										value={user.avatarUrl ?? ""} /></label>
							</div>
							<fieldset>
								<legend>Permissions</legend
								>{#each permissions as permission}<label
										class="check"
										><input
											type="checkbox"
											name="permissions"
											value={permission}
											checked={user.permissions.includes(
												permission,
											)} /><span>{permission}</span
										></label
									>{/each}<label class="check danger"
									><input
										type="checkbox"
										name="banned"
										checked={user.banned} /><span
										>Banned from CompCube</span
									></label>
							</fieldset>
							<Button type="submit" disabled={submitting}
								><i class="pi pi-save"></i>Save account</Button>
						</form>
						{#if data.season && stats}<form
								onsubmit={updateMmr}
								class="rating">
								<input
									type="hidden"
									name="userGuid"
									value={user.guid} /><input
									type="hidden"
									name="seasonGuid"
									value={data.season.guid} />
								<div>
									<p>Current season rating</p>
									<small>{data.season.name}</small>
								</div>
								<label
									>Starting MMR<input
										type="number"
										min="0"
										name="startingMmr"
										value={stats.startingMmr} /></label
								><label
									>Current MMR<input
										type="number"
										min="0"
										name="currentMmr"
										value={stats.currentMmr} /></label
								><Button type="submit" variant="secondary" disabled={submitting}
									><i class="pi pi-chart-line"></i>Update MMR</Button>
							</form>{/if}
					</div>{/if}
			</article>{/each}
	</div>
</section>

<style>
	.admin-page {
		padding-top: 2rem;
	}
	.admin-nav {
		display: flex;
		flex-wrap: wrap;
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
	.search {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: var(--surface);
	}
	.search i {
		color: var(--text-subtle);
	}
	.search input {
		width: 100%;
		border: 0;
		outline: 0;
		background: transparent;
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
	.users {
		display: grid;
		gap: 0.55rem;
	}
	.users article {
		overflow: hidden;
	}
	.users article.banned {
		border-color: rgba(255, 109, 121, 0.45);
	}
	.user-summary {
		display: grid;
		grid-template-columns: 3rem minmax(10rem, 1fr) minmax(12rem, 2fr) 5rem 1rem;
		align-items: center;
		gap: 1rem;
		width: 100%;
		padding: 0.8rem 1rem;
		border: 0;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}
	.avatar {
		display: grid;
		place-items: center;
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 50%;
		overflow: hidden;
		background: var(--background);
	}
	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.user-summary > div:nth-child(2) {
		display: grid;
	}
	.user-summary small {
		color: var(--text-subtle);
		font-size: 0.65rem;
	}
	.permission-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.permission-list span {
		padding: 0.1rem 0.35rem;
		border: 1px solid var(--border);
		border-radius: 99px;
		color: var(--text-muted);
		font: 600 0.62rem var(--font-secondary);
		text-transform: capitalize;
	}
	.permission-list .ban {
		color: var(--danger);
		border-color: var(--danger);
	}
	.mmr {
		display: grid;
		text-align: right;
	}
	.mmr small {
		font: 600 0.55rem var(--font-secondary);
	}
	.editor {
		padding: 1rem;
		border-top: 1px solid var(--border);
		background: var(--background-soft);
		animation: reveal 0.18s ease;
	}
	.fields {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.7rem;
		margin-bottom: 1rem;
	}
	.fields .wide {
		grid-column: span 2;
	}
	.editor label {
		display: grid;
		gap: 0.25rem;
		color: var(--text-muted);
		font: 600 0.68rem var(--font-secondary);
	}
	.editor input {
		padding: 0.55rem;
		border: 1px solid var(--border);
		border-radius: 0.3rem;
		background: var(--background);
		color: var(--text);
	}
	fieldset {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0;
		margin: 0 0 1rem;
		border: 0;
	}
	legend {
		margin-bottom: 0.4rem;
		color: var(--text-subtle);
		font: 600 0.68rem var(--font-secondary);
	}
	.check {
		display: flex !important;
		grid-template-columns: auto auto;
		align-items: center;
		padding: 0.3rem 0.45rem;
		border: 1px solid var(--border);
		border-radius: 0.3rem;
	}
	.check input {
		width: auto;
	}
	.check.danger {
		color: var(--danger);
	}
	.rating {
		display: grid;
		grid-template-columns: 1fr 8rem 8rem auto;
		align-items: end;
		gap: 0.7rem;
		padding-top: 1rem;
		margin-top: 1rem;
		border-top: 1px solid var(--border);
	}
	.rating p {
		margin: 0;
	}
	.rating small {
		color: var(--text-subtle);
	}
	@keyframes reveal {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
	}
	@media (max-width: 800px) {
		.user-summary {
			grid-template-columns: 3rem 1fr auto;
		}
		.permission-list,
		.mmr {
			display: none;
		}
		.fields {
			grid-template-columns: 1fr 1fr;
		}
		.rating {
			grid-template-columns: 1fr 1fr;
		}
		.rating > div {
			grid-column: 1/-1;
		}
	}
	@media (max-width: 520px) {
		.fields {
			grid-template-columns: 1fr;
		}
		.fields .wide {
			grid-column: auto;
		}
	}
</style>
