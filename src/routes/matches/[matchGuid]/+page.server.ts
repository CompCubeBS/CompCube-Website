import { createApiClient } from "$lib/api.server";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({
	fetch,
	locals,
	params,
	parent,
}) => {
	const response = await createApiClient(fetch, locals.authToken)
		.matches.get({ matchGuid: params.matchGuid })
		.catch(() => null);
	if (!response) throw error(503, "The CompCube API is unavailable.");
	if (response.status === 404) throw error(404, "Match not found.");
	if (!response.ok)
		throw error(response.status, "The match could not be loaded.");
	const layout = await parent();
	return {
		match: await response.json(),
		canModerate: Boolean(
			layout.profile?.permissions.some((permission) =>
				["role:moderator", "role:admin", "role:dev"].includes(
					permission,
				),
			),
		),
		isAdmin: Boolean(
			layout.profile?.permissions.some((permission) =>
				["role:admin", "role:dev"].includes(permission),
			),
		),
	};
};
