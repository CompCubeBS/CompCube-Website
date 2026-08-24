<script lang="ts">
	import { env } from "$env/dynamic/public";
	import Accordion from "$lib/components/Accordion.svelte";
	import Button from "$lib/components/Button.svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	let { data } = $props();
</script>

<PageMeta
	title="FAQ"
	description="Answers about CompCube setup, matchmaking, ratings, accounts, and supported Beat Saber versions."
	path="/faq" />
<PageHeader
	title="Frequently asked questions"
	description="Everything needed to install CompCube and understand competitive matchmaking." />

<section class="page-shell page-section faq-page">
	<Accordion items={data.faq} />
	<div class="support">
		<div>
			<h2>Still need help?</h2>
			<p>
				Ask in Discord and someone from the community can help with
				installation or matchmaking.
			</p>
		</div>
		<Button
			href={env.PUBLIC_DISCORD_URL || "https://discord.gg/nXU4vaJVjz"}
			target="_blank"
			rel="noreferrer"
			variant="secondary"
			><i class="pi pi-discord"></i>Open Discord</Button>
	</div>
</section>

<style>
	.faq-page {
		max-width: 900px;
		padding-top: 2rem;
	}
	.support {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 2rem;
		margin-top: 5rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border);
	}
	.support h2 {
		margin-bottom: 0.5rem;
		font-size: 1.6rem;
	}
	.support p {
		max-width: 36rem;
		margin: 0;
		color: var(--text-muted);
	}
	@media (max-width: 620px) {
		.support {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
