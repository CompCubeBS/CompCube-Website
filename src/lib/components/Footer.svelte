<script lang="ts">
	import { env } from "$env/dynamic/public";

	const socials = [
		{
			label: "Discord",
			href: env.PUBLIC_DISCORD_URL || "https://discord.gg/nXU4vaJVjz",
			icon: "pi pi-discord",
		},
		{
			label: "GitHub",
			href: env.PUBLIC_GITHUB_URL || "https://github.com/",
			icon: "pi pi-github",
		},
	];
</script>

<footer>
	<div class="rule"></div>
	<div class="page-shell footer-content">
		<div>
			<strong>CompCube</strong>
			<p>Competitive Beat Saber matchmaking.</p>
		</div>
		<nav aria-label="Footer navigation">
			<a href="/leaderboard">Leaderboard</a>
			<a href="/maps">Map pool</a>
			<a href="/download">Download</a>
			<a href="/faq">FAQ</a>
		</nav>
		<div class="socials">
			{#each socials as social (social.label)}
				<a
					href={social.href}
					target="_blank"
					rel="noreferrer"
					aria-label={social.label}>
					<i class={social.icon} aria-hidden="true"></i>
				</a>
			{/each}
		</div>
	</div>
</footer>

<style>
	footer {
		margin-top: 3rem;
	}
	.footer-content {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: start;
		gap: 2rem;
		padding-block: 2.5rem;
	}
	strong {
		font-size: 1.15rem;
	}
	p {
		margin: 0.25rem 0 0;
		color: var(--text-subtle);
		font-size: 0.78rem;
	}
	nav {
		display: flex;
		gap: 1.2rem;
	}
	nav a,
	.socials a {
		color: var(--text-muted);
		font-family: var(--font-secondary);
		font-size: 0.8rem;
		text-decoration: none;
	}
	nav a:hover,
	.socials a:hover {
		color: var(--text);
	}
	.socials {
		display: flex;
		justify-content: flex-end;
		gap: 0.9rem;
	}
	.socials a {
		font-size: 1rem;
	}
	@media (max-width: 720px) {
		.footer-content {
			grid-template-columns: 1fr auto;
		}
		nav {
			display: none;
		}
	}
</style>
