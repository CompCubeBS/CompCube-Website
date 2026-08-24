import { createApiClient } from "$lib/api.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
	const response = await createApiClient(fetch).server.getStatus().catch(() => null);
	return {
		supportedPluginVersions: response?.ok ? (await response.json()).supportedPluginVersions : [],
	};
};
