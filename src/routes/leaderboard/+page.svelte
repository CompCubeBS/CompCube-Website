<script lang="ts">
	import { goto } from "$app/navigation";
	import Button from "$lib/components/Button.svelte";
	import LeaderboardTable from "$lib/components/LeaderboardTable.svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	import TextBox from "$lib/components/TextBox.svelte";
	let { data } = $props();
	let userId = $state("");
	function openProfile() {
		if (userId.trim())
			void goto(`/users/${encodeURIComponent(userId.trim())}`);
	}
</script>

<PageMeta
	title="Leaderboard"
	description="Current CompCube player standings, ratings, records, and win streaks."
	path="/leaderboard" />
<PageHeader
	title="Leaderboard"
	description="Competitive standings ordered by current matchmaking rating." />

<section class="page-shell page-section leaderboard-page">
	<form
		onsubmit={(event) => {
			event.preventDefault();
			openProfile();
		}}>
		<TextBox
			bind:value={userId}
			type="search"
			label="Find a player"
			placeholder="BeatLeader or ScoreSaber ID" />
		<Button type="submit" variant="secondary"
			><i class="pi pi-search"></i>Open profile</Button>
	</form>
	{#if !data.apiAvailable}<p class="error-message">
			The leaderboard API could not be reached. Try again shortly.
		</p>{/if}
	<LeaderboardTable users={data.users} />
	<div class="pagination">
		<Button
			href={`/leaderboard?start=${Math.max(1, data.start - 10)}`}
			variant="ghost"
			disabled={data.start <= 1}
			><i class="pi pi-arrow-left"></i>Previous</Button>
		<span class="numeric">Ranks {data.start}–{data.start + 9}</span>
		<Button href={`/leaderboard?start=${data.start + 10}`} variant="ghost"
			>Next<i class="pi pi-arrow-right"></i></Button>
	</div>
</section>

<style>
	.leaderboard-page {
		padding-top: 2rem;
	}
	form {
		display: grid;
		grid-template-columns: minmax(14rem, 24rem) auto;
		align-items: end;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.error-message {
		margin-bottom: 1rem;
	}
	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1.25rem;
	}
	.pagination span {
		color: var(--text-subtle);
		font-size: 0.75rem;
	}
	@media (max-width: 560px) {
		form {
			grid-template-columns: 1fr;
		}
	}
</style>
