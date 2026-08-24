import { createApiClient } from "$lib/api.server";
import { requireAuth } from "$lib/auth.svelte";
import { error } from "@sveltejs/kit";
import type { Permission } from "compcube-client";

export const load = requireAuth(async ({ fetch, locals, parent }) => {
	const layout = await parent();
	if (
		!layout.profile?.permissions.some((permission: Permission) =>
			["role:admin", "role:dev"].includes(permission),
		)
	)
		throw error(403, "Administrator access is required.");
	const client = createApiClient(fetch, locals.authToken);
	const [usersResponse, seasonResponse] = await Promise.all([
		client.users.list(),
		client.seasons.current().catch(() => null),
	]);
	if (!usersResponse.ok)
		throw error(usersResponse.status, "Users could not be loaded.");
	return {
		users: await usersResponse.json(),
		season: seasonResponse?.ok ? await seasonResponse.json() : null,
	};
});
