import { createApiClient } from "$lib/api.server";
import { requireAuth } from "$lib/auth.svelte";
import { error } from "@sveltejs/kit";

export const load = requireAuth(async ({ fetch, locals }) => {
	const client = createApiClient(fetch, locals.authToken);
	const account = await client.account.me().catch(() => null);
	if (!account?.ok) throw error(account?.status ?? 503, "Your profile could not be loaded.");
	const identity = await account.json();
	const response = await client.users.get({ userGuid: identity.user.guid }).catch(() => null);
	if (!response) throw error(503, "The CompCube API is unavailable.");
	if (response.status === 404)
		throw error(
			404,
			"No CompCube player is linked to this BeatKhana account.",
		);
	if (!response.ok)
		throw error(response.status, "Your profile could not be loaded.");
	return { user: await response.json() };
});
