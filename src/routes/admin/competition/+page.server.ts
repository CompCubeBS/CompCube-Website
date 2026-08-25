import { createApiClient } from "$lib/api.server";
import { requireAuth } from "$lib/auth.svelte";
import { error } from "@sveltejs/kit";
import type { Permission } from "compcube-client";

export const load = requireAuth(async ({ fetch, locals, parent }) => {
	const layout = await parent();
	if (!layout.profile?.permissions.some((permission: Permission) => ["role:admin", "role:dev"].includes(permission))) throw error(403, "Administrator access is required.");
	const client = createApiClient(fetch, locals.authToken);
	const [seasonsResponse, currentResponse, queuesResponse, categoriesResponse] = await Promise.all([client.seasons.list(), client.seasons.current().catch(() => null), client.queues.list(), client.mapCategories.list()]);
	const current = currentResponse?.ok ? await currentResponse.json() : null;
	const poolsResponse = current ? await client.pools.forSeason({ seasonGuid: current.guid }) : null;
	return { seasons: seasonsResponse.ok ? await seasonsResponse.json() : [], current, pools: poolsResponse?.ok ? await poolsResponse.json() : [], queues: queuesResponse.ok ? await queuesResponse.json() : [], categories: categoriesResponse.ok ? await categoriesResponse.json() : [] };
});
