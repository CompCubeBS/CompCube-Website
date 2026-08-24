<script lang="ts">
	import DownloadSelector from "$lib/components/DownloadSelector.svelte";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import PageMeta from "$lib/components/PageMeta.svelte";
	let { data } = $props();
</script>

<PageMeta
	title="Download"
	description="Download the CompCube PCVR plugin for Beat Saber 1.39.1 or 1.40.8."
	path="/download" />
<PageHeader
	title="Download CompCube"
	description="Choose your installed Beat Saber version and download the matching PCVR plugin." />

<section class="page-shell page-section download-page">
	<div class="download-main">
		<h2>PCVR plugin</h2>
		<p>
			The files are served directly from CompCube. Select the exact
			version matching your Beat Saber installation.
		</p>
		<DownloadSelector />
		<div class="supported">
			<span>Currently supported plugin versions</span>
			{#if data.supportedPluginVersions.length}<div>{#each data.supportedPluginVersions as version}<code>{version}</code>{/each}</div>{:else}<strong>Development builds are currently accepted</strong>{/if}
		</div>
	</div>
	<div class="instructions">
		<h2>Installation</h2>
		<ol>
			<li>
				<span class="numeric">01</span>
				<div>
					<strong>Confirm your version</strong>
					<p>
						Check the Beat Saber version shown in-game or in your
						mod manager.
					</p>
				</div>
			</li>
			<li>
				<span class="numeric">02</span>
				<div>
					<strong>Download the DLL</strong>
					<p>
						Use the selector above and keep the filename unchanged.
					</p>
				</div>
			</li>
			<li>
				<span class="numeric">03</span>
				<div>
					<strong>Move it to Plugins</strong>
					<p>
						Place the file inside the Plugins directory of your
						modded Beat Saber installation.
					</p>
				</div>
			</li>
			<li>
				<span class="numeric">04</span>
				<div>
					<strong>Launch the game</strong>
					<p>
						CompCube will be available from the main menu after the
						game loads.
					</p>
				</div>
			</li>
		</ol>
	</div>
</section>

<style>
	.download-page {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(20rem, 0.8fr);
		gap: clamp(4rem, 10vw, 9rem);
		padding-top: 3rem;
	}
	.download-main > p,
	.instructions p {
		color: var(--text-muted);
	}
	.download-main > p {
		max-width: 38rem;
		margin-bottom: 2rem;
	}
	.supported { display:grid; gap:.5rem; margin-top:1.2rem; padding:1rem; border:1px solid var(--border); border-radius:.4rem; background:var(--surface); }
	.supported span { color:var(--text-subtle); font:700 .65rem var(--font-secondary); text-transform:uppercase; letter-spacing:.08em; }
	.supported div { display:flex; flex-wrap:wrap; gap:.4rem; }
	.supported code { padding:.2rem .45rem; border:1px solid var(--purple); border-radius:99px; color:var(--text); }
	.supported strong { font-size:.8rem; color:var(--warning); }
	.instructions h2,
	.download-main h2 {
		font-size: 1.7rem;
	}
	ol {
		padding: 0;
		margin: 0;
		list-style: none;
		border-top: 1px solid var(--border);
	}
	li {
		display: grid;
		grid-template-columns: 2rem 1fr;
		gap: 1rem;
		padding: 1.1rem 0;
		border-bottom: 1px solid var(--border);
	}
	li > span {
		color: var(--purple);
		font-size: 0.72rem;
	}
	li strong {
		display: block;
		margin-bottom: 0.2rem;
		font-family: var(--font-secondary);
		font-size: 0.9rem;
	}
	li p {
		margin: 0;
		font-size: 0.8rem;
	}
	@media (max-width: 800px) {
		.download-page {
			grid-template-columns: 1fr;
		}
	}
</style>
