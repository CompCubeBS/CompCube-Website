<script lang="ts">
	let { title, description }: { title: string; description: string } =
		$props();
</script>

<header class="page-shell page-header">
	<h1>{title}</h1>
	<p>{description}</p>
</header>

<style>
	.page-header {
		padding-top: clamp(4rem, 9vw, 7rem);
		padding-bottom: clamp(2.5rem, 5vw, 4rem);
		border-bottom: 1px solid var(--border);
	}
	h1 {
		max-width: 13ch;
		margin-bottom: 1rem;
		font-size: clamp(2.5rem, 6vw, 4.8rem);
	}
	p {
		max-width: 46rem;
		margin: 0;
		color: var(--text-muted);
		font-size: 1.05rem;
	}
</style>
