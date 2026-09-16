import { createApiClient } from "$lib/api.server";
import { requireAuth } from "$lib/auth.svelte";
import { error } from "@sveltejs/kit";
import type { Permission, ReportFilter } from "compcube-client";

export const load = requireAuth(async ({ fetch, locals, parent, url }) => {
	const layout = await parent();
	const canModerate = layout.profile?.permissions.some((permission: Permission) =>
		["role:moderator", "role:admin", "role:dev"].includes(permission),
	);
	if (!canModerate) throw error(403, "Moderator access is required.");

	const requestedFilter = url.searchParams.get("filter") ?? "unresolved";
	const filter: ReportFilter = ["all", "unresolved", "resolved"].includes(requestedFilter)
		? requestedFilter as ReportFilter
		: "unresolved";
	const response = await createApiClient(fetch, locals.authToken).reports.list({ filter }).catch(() => null);
	if (!response) throw error(503, "The CompCube API is unavailable.");
	if (!response.ok) throw error(response.status, "Reports could not be loaded.");

	return {
		reports: await response.json(),
		filter,
		isAdmin: layout.profile?.permissions.some((permission: Permission) =>
			["role:admin", "role:dev"].includes(permission),
		) ?? false,
		isDeveloper: layout.profile?.permissions.includes("role:dev" as Permission) ?? false,
	};
});
