<script lang="ts">
	import { env } from "$env/dynamic/public";

	let {
		title,
		description,
		path = "",
	}: {
		title: string;
		description: string;
		path?: string;
	} = $props();

	const siteName = "CompCube";
	const fullTitle = $derived(
		title === siteName ? title : `${title} | ${siteName}`,
	);
	const siteUrl = $derived(
		(env.PUBLIC_SITE_URL || "https://compcube.net").replace(/\/$/, ""),
	);
	const canonical = $derived(
		`${siteUrl}${path.startsWith("/") ? path : `/${path}`}`,
	);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<meta name="theme-color" content="#08090d" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<link rel="canonical" href={canonical} />
</svelte:head>
