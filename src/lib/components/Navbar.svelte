<script lang="ts">
	import { page } from "$app/state";
	import { useAuth } from "$lib/auth.svelte";
	import Button from "./Button.svelte";

	const auth = useAuth();
	let menuOpen = $state(false);

	const links = [
		{ href: "/leaderboard", label: "Leaderboard" },
		{ href: "/matches", label: "Matches" },
		{ href: "/queues", label: "Queues" },
		{ href: "/maps", label: "Map pool" },
		{ href: "/download", label: "Download" },
		{ href: "/faq", label: "FAQ" },
	];

	function isActive(href: string) {
		return (
			page.url.pathname === href ||
			page.url.pathname.startsWith(`${href}/`)
		);
	}
</script>

<header class="site-header">
	<nav class="page-shell" aria-label="Main navigation">
		<a
			class="brand"
			href="/"
			aria-label="CompCube home"
			onclick={() => (menuOpen = false)}>
			<img src="/assets/logo.svg" alt="CompCube" />
		</a>

		<div class="desktop-links">
			{#each links as link (link.href)}
				<a href={link.href} class:active={isActive(link.href)}
					>{link.label}</a>
			{/each}
			{#if auth.profile?.permissions.some((permission) => ["role:moderator", "role:admin", "role:dev"].includes(permission))}<a href="/admin/reports" class:active={isActive("/admin")}><i class="pi pi-shield"></i> Moderation</a>{/if}
		</div>

		<div class="account">
			{#if auth.isAuthenticated}
				<a class="profile-link" href="/profile">
					<span>{auth.profile?.username ?? "Profile"}</span>
					<i class="pi pi-user" aria-hidden="true"></i>
				</a>
			{:else}
				<Button size="small" onclick={() => auth.login()}>
					<i class="pi pi-sign-in" aria-hidden="true"></i>
					Login with BeatKhana
				</Button>
			{/if}
			<Button
				variant="ghost"
				size="icon"
				ariaLabel="Toggle navigation"
				onclick={() => (menuOpen = !menuOpen)}>
				<i
					class={`pi ${menuOpen ? "pi-times" : "pi-bars"}`}
					aria-hidden="true"></i>
			</Button>
		</div>
	</nav>

	{#if menuOpen}
		<div class="mobile-menu page-shell">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class:active={isActive(link.href)}
					onclick={() => (menuOpen = false)}>{link.label}</a>
			{/each}
			{#if auth.profile?.permissions.some((permission) => ["role:moderator", "role:admin", "role:dev"].includes(permission))}<a href="/admin/reports" onclick={() => (menuOpen = false)}>Moderation</a>{/if}
			{#if auth.isAuthenticated}
				<a href="/profile" onclick={() => (menuOpen = false)}
					>My profile</a>
				<button type="button" onclick={() => auth.logout()}
					>Log out</button>
			{/if}
		</div>
	{/if}
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 40;
		min-height: var(--header-height);
		border-bottom: 1px solid rgba(65, 69, 84, 0.65);
		background: rgba(8, 9, 13, 0.88);
		backdrop-filter: blur(16px);
	}
	nav {
		display: grid;
		grid-template-columns: minmax(7rem, 1fr) auto minmax(7rem, 1fr);
		align-items: center;
		min-height: var(--header-height);
		gap: 1rem;
	}
	.brand {
		justify-self: start;
	}
	.brand img {
		width: auto;
		height: 3.5rem;
	}
	.desktop-links {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.desktop-links a,
	.profile-link {
		padding: 0.55rem 0.7rem;
		color: var(--text-muted);
		font-family: var(--font-secondary);
		font-size: 0.84rem;
		font-weight: 600;
		text-decoration: none;
		transition: color var(--transition);
	}
	.desktop-links a:hover,
	.desktop-links a.active,
	.profile-link:hover {
		color: var(--text);
	}
	.desktop-links a.active {
		text-decoration: underline;
		text-decoration-color: var(--purple);
		text-underline-offset: 0.55rem;
	}
	.account {
		display: flex;
		align-items: center;
		justify-self: end;
		gap: 0.4rem;
	}
	.profile-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.account :global(.icon) {
		display: none;
	}
	.mobile-menu {
		display: none;
		padding-bottom: 1rem;
	}
	.mobile-menu a,
	.mobile-menu button {
		padding: 0.8rem 0;
		border: 0;
		border-bottom: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		font-family: var(--font-secondary);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}
	.mobile-menu a.active {
		color: var(--text);
	}
	@media (max-width: 820px) {
		nav {
			grid-template-columns: 1fr auto;
		}
		.desktop-links {
			display: none;
		}
		.account :global(.icon) {
			display: inline-flex;
		}
		.mobile-menu {
			display: grid;
		}
	}
	@media (max-width: 560px) {
		.account > :global(.button:not(.icon)),
		.profile-link span {
			display: none;
		}
	}
</style>
