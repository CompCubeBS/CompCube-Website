<script lang="ts">
	let {
		label,
		status = "neutral",
	}: {
		label: string;
		status?: "online" | "warning" | "offline" | "neutral";
	} = $props();
</script>

<span class={status}><i aria-hidden="true"></i>{label}</span>

<style>
	span {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--text-muted);
		font-family: var(--font-secondary);
		font-size: 0.78rem;
		font-weight: 650;
	}
	i {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: var(--text-subtle);
	}
	.online i {
		background: var(--success);
	}
	.warning i {
		background: var(--warning);
	}
	.offline i {
		background: var(--danger);
	}
</style>
