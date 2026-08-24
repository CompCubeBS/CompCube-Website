<script module lang="ts">
	export interface DropdownOption {
		label: string;
		value: string;
		description?: string;
	}
</script>

<script lang="ts">
	let {
		value = $bindable(""),
		options,
		label,
		name,
		disabled = false,
		onchange,
	}: {
		value?: string;
		options: DropdownOption[];
		label?: string;
		name?: string;
		disabled?: boolean;
		onchange?: (value: string) => void;
	} = $props();

	const id = $props.id();
</script>

<label class="field" for={id}>
	{#if label}<span>{label}</span>{/if}
	<div class="select-wrap">
		<select
			{id}
			bind:value
			{name}
			{disabled}
			onchange={() => onchange?.(value)}>
			{#each options as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<i class="pi pi-chevron-down" aria-hidden="true"></i>
	</div>
	{#if options.find((option) => option.value === value)?.description}
		<small
			>{options.find((option) => option.value === value)
				?.description}</small>
	{/if}
</label>

<style>
	.field {
		display: grid;
		gap: 0.4rem;
		font-family: var(--font-secondary);
	}
	.field > span {
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 650;
	}
	.select-wrap {
		position: relative;
	}
	select {
		width: 100%;
		min-height: 2.75rem;
		padding: 0.65rem 2.5rem 0.65rem 0.8rem;
		appearance: none;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--background-soft);
		color: var(--text);
		cursor: pointer;
	}
	select:focus {
		outline: none;
		border-color: var(--blue);
	}
	i {
		position: absolute;
		top: 50%;
		right: 0.85rem;
		/* transform: translateY(-50%); */
		color: var(--text-subtle);
		font-size: 0.75rem;
		pointer-events: none;
	}
	small {
		color: var(--text-subtle);
		font-size: 0.76rem;
	}
</style>
