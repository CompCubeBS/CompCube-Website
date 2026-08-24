<script lang="ts">
	import "../app.css";
	import Navbar from "$lib/components/Navbar.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { initAuth } from "$lib/auth.svelte";
	import type { LayoutData } from "./$types";
	import { untrack, type Snippet } from "svelte";

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
	const auth = untrack(() => initAuth(data.authToken, data.profile));
	$effect(() => auth.hydrate(data.authToken, data.profile));
</script>

<svelte:head>
	<meta name="color-scheme" content="dark" />
	<link rel="icon" href="/assets/logo.svg" />
</svelte:head>

<Navbar />
<main class="page-main">{@render children()}</main>
<Footer />
