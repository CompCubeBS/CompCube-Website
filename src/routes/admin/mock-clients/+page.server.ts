import { createApiClient } from "$lib/api.server";
import { requireAuth } from "$lib/auth.svelte";
import { error } from "@sveltejs/kit";
import type { Permission } from "compcube-client";

export const load = requireAuth(async ({ fetch, locals, parent }) => {
	const layout = await parent();
	if (!layout.profile?.permissions.includes("role:dev" as Permission)) throw error(403, "Developer access is required.");
	const client = createApiClient(fetch, locals.authToken);
	const [clientsResponse, queuesResponse] = await Promise.all([
		client.mockClients.list(),
		client.queues.list(),
	]);
	if (!clientsResponse.ok || !queuesResponse.ok) throw error(502, "Mock client data could not be loaded.");
	return { clients: await clientsResponse.json(), queues: await queuesResponse.json() };
});
