import { createApiClient } from "$lib/api.server";
import { requireAuth } from "$lib/auth.svelte";
import { error, fail, type Actions } from "@sveltejs/kit";
import type { Permission } from "compcube-client";

export const load = requireAuth(async ({ fetch, locals, parent }) => {
	const layout = await parent();
	if (!layout.profile?.permissions.some((permission: Permission) => ["role:admin", "role:dev"].includes(permission))) throw error(403, "Administrator access is required.");
	const client = createApiClient(fetch, locals.authToken);
	const [usersResponse, seasonResponse] = await Promise.all([client.users.list(), client.seasons.current().catch(() => null)]);
	if (!usersResponse.ok) throw error(usersResponse.status, "Users could not be loaded.");
	return { users: await usersResponse.json(), season: seasonResponse?.ok ? await seasonResponse.json() : null };
});

const permissions: Permission[] = ["role:admin", "role:dev", "role:pooler", "role:moderator", "role:player", "perk:supporter", "perk:contributor"];
export const actions: Actions = {
	update: async ({ request, fetch, locals }) => {
		const form = await request.formData(); const userGuid = String(form.get("userGuid") ?? "");
		const selected = form.getAll("permissions").map(String).filter((permission): permission is Permission => permissions.includes(permission as Permission));
		const body = {
			userGuid,
			username: String(form.get("username") ?? "").trim(),
			avatarUrl: String(form.get("avatarUrl") ?? "").trim() || null,
			beatKhanaGuid: String(form.get("beatKhanaGuid") ?? "").trim() || null,
			discordId: String(form.get("discordId") ?? "").trim() || null,
			platformId: String(form.get("platformId") ?? "").trim() || null,
			banned: form.get("banned") === "on",
			permissions: selected.length ? selected : ["role:player" as const],
		};
		const response = await createApiClient(fetch, locals.authToken).users.update(body).catch(() => null);
		if (!response?.ok) return fail(response?.status ?? 502, { message: "The user could not be updated.", userGuid });
		return { success: true, message: "Account updated.", userGuid };
	},
	mmr: async ({ request, fetch, locals }) => {
		const form = await request.formData(); const userGuid = String(form.get("userGuid") ?? ""); const seasonGuid = String(form.get("seasonGuid") ?? ""); const currentMmr = Number(form.get("currentMmr")); const startingMmr = Number(form.get("startingMmr"));
		if (!Number.isInteger(currentMmr) || currentMmr < 0 || !Number.isInteger(startingMmr) || startingMmr < 0) return fail(400, { message: "MMR values must be non-negative integers.", userGuid });
		const response = await createApiClient(fetch, locals.authToken).statistics.update({ seasonGuid, userGuid, currentMmr, startingMmr }).catch(() => null);
		if (!response?.ok) return fail(response?.status ?? 502, { message: "The rating could not be updated.", userGuid });
		return { success: true, message: "Rating updated.", userGuid };
	},
};
