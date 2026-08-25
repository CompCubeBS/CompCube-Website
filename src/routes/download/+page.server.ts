import { createApiClient } from "$lib/api.server";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { asPluginDownloads, type PluginReleaseResponse } from "$lib/data/downloads";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
	const apiUrl = privateEnv.COMPCUBE_INTERNAL_API_URL || publicEnv.PUBLIC_COMPCUBE_API_URL || "https://api.compcube.net";
	const [response, releaseResponse] = await Promise.all([
		createApiClient(fetch).server.getStatus().catch(() => null),
		fetch(`${apiUrl.replace(/\/$/, "")}/plugin-releases`).catch(() => null),
	]);
	const releaseData = releaseResponse?.ok ? await releaseResponse.json() as PluginReleaseResponse : null;
	return {
		supportedPluginVersions: response?.ok ? (await response.json()).supportedPluginVersions : [],
		servedPluginVersion: releaseData?.servedPluginVersion ?? null,
		downloads: asPluginDownloads(releaseData),
	};
};
