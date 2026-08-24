<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	let { data } = $props();
</script>

<PageMeta
	title="Login failed"
	description="CompCube could not complete the BeatKhana login request."
	path="/auth/error" />
<section class="page-shell auth-error">
	<i class="pi pi-exclamation-circle" aria-hidden="true"></i>
	<h1>Login failed</h1>
	<p>{data.message}</p>
	<div class="actions">
		<Button href="/auth/login">Try again</Button>
		<Button href="/" variant="secondary">Return home</Button>
	</div>
</section>

<style>
	.auth-error {
		max-width: 42rem;
		padding-block: 8rem;
		text-align: center;
	}
	.auth-error > i {
		color: var(--red);
		font-size: 2rem;
	}
	h1 {
		margin: 1rem 0;
		font-size: clamp(2.5rem, 7vw, 4rem);
	}
	p {
		color: var(--text-muted);
	}
	.actions {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 2rem;
	}
</style>
