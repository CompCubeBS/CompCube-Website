import { createApiClient } from "$lib/api.server";
import type { PageServerLoad } from "./$types";
import type { LeaderboardEntry } from "compcube-client";

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	const start = Math.max(
		1,
		Number.parseInt(url.searchParams.get("start") ?? "1", 10) || 1,
	);
	const response = await createApiClient(fetch, locals.authToken)
		.leaderboard.getRange({ start, range: 10 })
		.catch(() => null);
	const users = response?.ok ? await response.json() : ([] as LeaderboardEntry[]);
	return { users, start, apiAvailable: Boolean(response) };
};
