import { createApiClient } from "$lib/api.server";
import { faqItems } from "$lib/server/faq";
import type { PageServerLoad } from "./$types";
import type { HealthResponse, LeaderboardEntry, User } from "compcube-client";

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const client = createApiClient(fetch, locals.authToken);
	const [leaderboard, status, contributors] = await Promise.all([
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
	]);

	return { leaderboard, status, contributors, faq: faqItems.slice(0, 4) };
};
