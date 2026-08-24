<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";

	let {
		value = $bindable(""),
		label,
		name,
		placeholder,
		type = "text",
		required = false,
		disabled = false,
		helper,
		autocomplete,
	}: {
		value?: string;
		label?: string;
		name?: string;
		placeholder?: string;
		type?: "text" | "search" | "email" | "password";
		required?: boolean;
		disabled?: boolean;
		helper?: string;
		autocomplete?: HTMLInputAttributes["autocomplete"];
	} = $props();

	const id = $props.id();
</script>

<label class="field" for={id}>
	{#if label}<span>{label}{required ? " *" : ""}</span>{/if}
	<input
		{id}
		bind:value
		{name}
		{placeholder}
		{type}
		{required}
		{disabled}
		{autocomplete} />
	{#if helper}<small>{helper}</small>{/if}
</label>

<style>
	.field {
		display: grid;
		gap: 0.4rem;
		font-family: var(--font-secondary);
	}
	span {
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 650;
	}
	input {
		width: 100%;
		min-height: 2.75rem;
		padding: 0.65rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--background-soft);
		color: var(--text);
		transition:
			border-color var(--transition),
			background var(--transition);
	}
	input:hover:not(:disabled) {
		border-color: var(--border-strong);
	}
	input:focus {
		outline: none;
		border-color: var(--blue);
		background: var(--surface);
	}
	input::placeholder,
	small {
		color: var(--text-subtle);
	}
	small {
		font-size: 0.76rem;
	}
</style>
