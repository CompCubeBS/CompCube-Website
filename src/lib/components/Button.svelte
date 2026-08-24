<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		children,
		href,
		variant = "primary",
		size = "medium",
		type = "button",
		disabled = false,
		loading = false,
		fullWidth = false,
		target,
		rel,
		download,
		onclick,
		ariaLabel,
	}: {
		children: Snippet;
		href?: string;
		variant?: "primary" | "secondary" | "ghost" | "danger";
		size?: "small" | "medium" | "large" | "icon";
		type?: "button" | "submit" | "reset";
		disabled?: boolean;
		loading?: boolean;
		fullWidth?: boolean;
		target?: string;
		rel?: string;
		download?: string | boolean;
		onclick?: (event: MouseEvent) => void;
		ariaLabel?: string;
	} = $props();

	const classes = $derived(
		`button ${variant} ${size}${fullWidth ? " full-width" : ""}`,
	);
</script>

{#if href}
	<a
		class={classes}
		href={disabled ? undefined : href}
		{target}
		{rel}
		{download}
		aria-label={ariaLabel}
		aria-disabled={disabled}
		tabindex={disabled ? -1 : undefined}
		onclick={(event) => {
			if (disabled) event.preventDefault();
			else onclick?.(event);
		}}>
		{@render children()}
	</a>
{:else}
	<button
		class={classes}
		{type}
		disabled={disabled || loading}
		aria-busy={loading}
		aria-label={ariaLabel}
		{onclick}>
		{#if loading}<i class="pi pi-spin pi-spinner" aria-hidden="true"></i
			>{/if}
		{@render children()}
	</button>
{/if}

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		min-height: 2.65rem;
		padding: 0.6rem 1rem;
		border: 1px solid transparent;
		border-radius: var(--radius);
		font-family: var(--font-secondary);
		font-size: 0.88rem;
		font-weight: 650;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
		transition:
			color var(--transition),
			background var(--transition),
			border-color var(--transition);
	}
	.button:disabled,
	.button[aria-disabled="true"] {
		cursor: not-allowed;
		opacity: 0.45;
		pointer-events: none;
	}
	.primary {
		background: var(--text);
		color: var(--background);
	}
	.primary:hover:not(:disabled) {
		background: #dcdbe2;
	}
	.secondary {
		background: transparent;
		border-color: var(--border-strong);
		color: var(--text);
	}
	.secondary:hover:not(:disabled),
	.ghost:hover:not(:disabled) {
		background: var(--surface-hover);
		border-color: var(--blue);
	}
	.ghost {
		background: transparent;
		color: var(--text-muted);
	}
	.danger {
		background: var(--red-soft);
		border-color: rgba(240, 78, 100, 0.4);
		color: #ffadb8;
	}
	.small {
		min-height: 2.2rem;
		padding: 0.45rem 0.75rem;
		font-size: 0.8rem;
	}
	.large {
		min-height: 3rem;
		padding-inline: 1.25rem;
	}
	.icon {
		width: 2.65rem;
		padding: 0;
	}
	.full-width {
		width: 100%;
	}
</style>
