<script lang="ts">
	import { page } from "$app/state";
	import Button from "$lib/components/Button.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
</script>

<PageMeta
	title={`${page.status} error`}
	description="The requested CompCube page could not be loaded."
	path={page.url.pathname} />
<section class="page-shell error-page">
	<span class="numeric">{page.status}</span>
	<h1>{page.status === 404 ? "Page not found" : "Something went wrong"}</h1>
	<p>{page.error?.message ?? "The requested page could not be loaded."}</p>
	<Button href="/">Return home</Button>
</section>

<style>
	.error-page {
		max-width: 42rem;
		padding-block: 8rem;
	}
	.error-page > span {
		color: var(--red);
	}
	h1 {
		margin: 0.8rem 0;
		font-size: clamp(2.5rem, 7vw, 4rem);
	}
	p {
		margin-bottom: 2rem;
		color: var(--text-muted);
	}
</style>
