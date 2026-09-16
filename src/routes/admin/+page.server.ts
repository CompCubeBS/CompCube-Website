import { requireAuth } from "$lib/auth.svelte";
import { error, redirect } from "@sveltejs/kit";
import type { Permission } from "compcube-client";

export const load = requireAuth(async ({ parent }) => {
	const profile = (await parent()).profile;
	if (profile?.permissions.some((permission: Permission) => ["role:admin", "role:dev"].includes(permission)))
		throw redirect(303, "/admin/users");
	if (profile?.permissions.includes("role:moderator" as Permission))
		throw redirect(303, "/admin/reports");
	throw error(403, "Moderator access is required.");
});
