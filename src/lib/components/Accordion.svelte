<script lang="ts">
	let {
		items,
	}: {
		items: Array<{ question: string; answer: string; icon?: string }>;
	} = $props();
</script>

<div class="accordion">
	{#each items as item, index (item.question)}
		<details open={index === 0}>
			<summary>
				<span
					>{#if item.icon}<i class={item.icon} aria-hidden="true"></i
						>{/if}{item.question}</span>
				<i class="pi pi-plus toggle" aria-hidden="true"></i>
			</summary>
			<p>{item.answer}</p>
		</details>
	{/each}
</div>

<style>
	.accordion {
		border-top: 1px solid var(--border);
	}
	details {
		border-bottom: 1px solid var(--border);
	}
	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.2rem 0;
		font-size: 1.08rem;
		font-weight: 700;
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary span {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	summary span i {
		width: 1rem;
		color: var(--purple);
		font-size: 0.9rem;
	}
	.toggle {
		color: var(--text-subtle);
		font-size: 0.8rem;
		transition:
			transform var(--transition),
			color var(--transition);
	}
	details[open] .toggle {
		transform: rotate(45deg);
		color: var(--blue);
	}
	p {
		max-width: 52rem;
		padding: 0 0 1.25rem 1.75rem;
		margin: 0;
		color: var(--text-muted);
	}
</style>
