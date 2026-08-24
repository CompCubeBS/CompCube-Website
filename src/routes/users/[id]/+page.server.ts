import { createApiClient } from "$lib/api.server";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({
	fetch,
	locals,
	params,
	parent,
}) => {
	const client = createApiClient(fetch, locals.authToken);
	let response = await client.users
		.get({ userGuid: params.id })
		.catch(() => null);
	if (response?.status === 404)
		response = await client.users
			.getByPlatformId({ platformId: params.id })
			.catch(() => null);
	if (!response) throw error(503, "The CompCube API is unavailable.");
	if (response.status === 404) throw error(404, "Player not found.");
	if (!response.ok)
		throw error(response.status, "The player profile could not be loaded.");
	const user = await response.json();
	const layout = await parent();
	const canModerate = Boolean(
		layout.profile?.permissions.some((permission) =>
			["role:moderator", "role:admin", "role:dev"].includes(permission),
		),
	);
	const historyResponse = canModerate
		? await client.moderation
				.timeouts({ userGuid: user.guid })
				.catch(() => null)
		: null;
	return {
		user,
		canModerate,
		timeoutHistory: historyResponse?.ok ? await historyResponse.json() : [],
	};
};
