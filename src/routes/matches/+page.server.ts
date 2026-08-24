import { createApiClient } from "$lib/api.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, url }) => {
	const status = url.searchParams.get("status") || undefined;
	const response = await createApiClient(fetch).matches.list({ status, limit: 100 }).catch(() => null);
	return { matches: response?.ok ? await response.json() : [], status, apiAvailable: Boolean(response) };
};
