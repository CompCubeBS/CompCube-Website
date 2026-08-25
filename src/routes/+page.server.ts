import { createApiClient } from "$lib/api.server";
import { faqItems } from "$lib/server/faq";
import type { PageServerLoad } from "./$types";
import type { HealthResponse, LeaderboardEntry, User } from "compcube-client";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { asPluginDownloads, type PluginReleaseResponse } from "$lib/data/downloads";

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const client = createApiClient(fetch, locals.authToken);
	const apiUrl = privateEnv.COMPCUBE_INTERNAL_API_URL || publicEnv.PUBLIC_COMPCUBE_API_URL || "https://api.compcube.net";
	const [leaderboard, status, contributors, releaseResponse] = await Promise.all([
		client.leaderboard
			.getRange({ start: 1, range: 5 })
			.then((response) =>
				response.ok ? response.json() : ([] as LeaderboardEntry[]),
			)
			.catch(() => [] as LeaderboardEntry[]),
		client.server
			.health()
			.then((response) =>
				response.ok ? response.json() : (null as HealthResponse | null),
			)
			.catch(() => null),
		client.server
			.getContributors()
			.then((response) =>
				response.ok ? response.json() : ([] as User[]),
			)
			.catch(() => [] as User[]),
		fetch(`${apiUrl.replace(/\/$/, "")}/plugin-releases`).catch(() => null),
	]);

	const releaseData = releaseResponse?.ok ? await releaseResponse.json() as PluginReleaseResponse : null;
	return { leaderboard, status, contributors, downloads: asPluginDownloads(releaseData), servedPluginVersion: releaseData?.servedPluginVersion ?? null, faq: faqItems.slice(0, 4) };
};
