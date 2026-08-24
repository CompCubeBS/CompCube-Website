<script lang="ts">
	import { env } from "$env/dynamic/public";
	import Accordion from "$lib/components/Accordion.svelte";
	import Button from "$lib/components/Button.svelte";
	import DownloadSelector from "$lib/components/DownloadSelector.svelte";
	import LeaderboardTable from "$lib/components/LeaderboardTable.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	import StatusPill from "$lib/components/StatusPill.svelte";
	let { data } = $props();
</script>

<PageMeta
	title="CompCube"
	description="Competitive Beat Saber matchmaking, ratings, map pools, and the CompCube PCVR plugin."
	path="/" />

<section class="page-shell hero">
	<div class="hero-copy">
		<h1>
			Competitive Beat Saber, <span class="split-accent"
				>one cube at a time.</span>
		</h1>
		<p>
			Queue for structured matches, play a curated map pool, and climb a
			persistent competitive leaderboard.
		</p>
		<div class="hero-actions">
			<Button href="/download" size="large"
				><i class="pi pi-download" aria-hidden="true"></i>Get the plugin</Button>
			<Button href="/leaderboard" size="large" variant="secondary"
				>View leaderboard</Button>
		</div>
	</div>
	<div class="hero-side">
		<div class="status-line">
			<StatusPill
				label={data.status?.ok
					? "Servers online"
					: "Status unavailable"}
				status={data.status?.ok
					? "online"
					: "neutral"} />
		</div>
		<h2>Ready to play?</h2>
		<p>
			Select the version matching your PCVR install. The DLL goes directly
			into your Beat Saber Plugins folder.
		</p>
		<DownloadSelector compact />
	</div>
</section>

<section class="page-section">
	<div class="page-shell">
		<div class="section-heading">
			<div>
				<h2>Top players</h2>
				<p>The current CompCube competitive standings.</p>
			</div>
			<a class="inline-link font-secondary" href="/leaderboard"
				>Full leaderboard <i class="pi pi-arrow-right"></i></a>
		</div>
		<LeaderboardTable users={data.leaderboard} compact />
	</div>
</section>

<section class="page-section how-it-works">
	<div class="page-shell">
		<div class="section-heading">
			<div>
				<h2>How it works</h2>
				<p>
					A direct path from installation to your first rated match.
				</p>
			</div>
		</div>
		<div class="steps">
			<div>
				<span class="numeric red">01</span>
				<h3>Install</h3>
				<p>
					Download the DLL for your version and place it in the Beat
					Saber Plugins folder.
				</p>
			</div>
			<div>
				<span class="numeric purple">02</span>
				<h3>Queue</h3>
				<p>
					Open CompCube in-game, choose a queue, and wait for a
					suitable opponent.
				</p>
			</div>
			<div>
				<span class="numeric blue">03</span>
				<h3>Compete</h3>
				<p>
					Complete picks and bans, play the selected maps, and earn
					your position.
				</p>
			</div>
		</div>
	</div>
</section>

<section class="page-section">
	<div class="page-shell faq-preview">
		<div class="section-heading">
			<div>
				<h2>Common questions</h2>
				<p>Setup, matchmaking, accounts, and supported versions.</p>
			</div>
			<a class="inline-link font-secondary" href="/faq"
				>Read all FAQs <i class="pi pi-arrow-right"></i></a>
		</div>
		<Accordion items={data.faq} />
	</div>
</section>

{#if data.contributors.length > 0}
	<section class="page-section">
		<div class="page-shell contributors">
			<div class="section-heading">
				<div>
					<h2>Project contributors</h2>
					<p>The people building and maintaining CompCube.</p>
				</div>
			</div>
			<div class="contributor-list">
				{#each data.contributors as contributor (contributor.guid)}
					<div>
						<strong>{contributor.username}</strong><span>Contributor</span>
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<section class="page-section community">
	<div class="page-shell community-grid">
		<div>
			<h2>Play with the community.</h2>
			<p>
				Find matches, get setup help, follow development, and meet other
				competitive players.
			</p>
		</div>
		<div class="community-links">
			<Button
				href={env.PUBLIC_DISCORD_URL || "https://discord.gg/"}
				target="_blank"
				rel="noreferrer"
				variant="secondary"
				><i class="pi pi-discord"></i>Discord</Button>
			<Button
				href={env.PUBLIC_GITHUB_URL || "https://github.com/"}
				target="_blank"
				rel="noreferrer"
				variant="secondary"><i class="pi pi-github"></i>GitHub</Button>
		</div>
	</div>
</section>

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(18rem, 0.65fr);
		align-items: end;
		gap: clamp(3rem, 8vw, 8rem);
		min-height: min(760px, calc(100vh - var(--header-height)));
		padding-block: clamp(5rem, 10vw, 9rem);
	}
	.hero h1 {
		max-width: 13ch;
		margin-bottom: 1.5rem;
	}
	.hero-copy > p {
		max-width: 42rem;
		color: var(--text-muted);
		font-size: 1.08rem;
	}
	.hero-actions,
	.community-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		margin-top: 2rem;
	}
	.hero-side {
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-strong);
	}
	.status-line {
		margin-bottom: 2.2rem;
	}
	.hero-side h2 {
		margin-bottom: 0.75rem;
		font-size: 1.7rem;
	}
	.hero-side > p {
		margin-bottom: 1.5rem;
		color: var(--text-muted);
		font-size: 0.9rem;
	}
	.steps {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2.5rem;
	}
	.steps > div {
		padding-top: 1.4rem;
		border-top: 1px solid var(--border);
	}
	.steps span {
		display: block;
		margin-bottom: 2.5rem;
		font-size: 0.8rem;
	}
	.steps .red {
		color: var(--red);
	}
	.steps .purple {
		color: var(--purple);
	}
	.steps .blue {
		color: var(--blue);
	}
	.steps p,
	.community p {
		color: var(--text-muted);
	}
	.faq-preview {
		max-width: 900px;
	}
	.contributor-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		border-top: 1px solid var(--border);
	}
	.contributor-list > div {
		display: grid;
		padding: 1rem 0;
		border-bottom: 1px solid var(--border);
	}
	.contributor-list strong {
		font-family: var(--font-secondary);
		font-size: 0.9rem;
	}
	.contributor-list span {
		color: var(--text-subtle);
		font-family: var(--font-secondary);
		font-size: 0.75rem;
	}
	.community-grid {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: end;
		gap: 3rem;
	}
	.community h2 {
		margin-bottom: 0.6rem;
	}
	.community p {
		max-width: 36rem;
		margin: 0;
	}
	.community-links {
		margin: 0;
	}
	@media (max-width: 840px) {
		.hero {
			grid-template-columns: 1fr;
			min-height: auto;
		}
		.hero-side {
			max-width: 38rem;
		}
		.steps {
			grid-template-columns: 1fr;
		}
		.steps span {
			margin-bottom: 1rem;
		}
		.community-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}
</style>
