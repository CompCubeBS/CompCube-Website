import { createApiClient } from "$lib/api.server";
import type { PageServerLoad } from "./$types";
export const load: PageServerLoad = async ({ fetch }) => {
	const response = await createApiClient(fetch).queues.list().catch(() => null);
	return { queues: response?.ok ? await response.json() : [], apiAvailable: Boolean(response) };
};
