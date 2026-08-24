import { createApiClient } from "$lib/api.server";
import { error, fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, locals, params, parent }) => {
	const client = createApiClient(fetch, locals.authToken);
	let response = await client.users.get({ userGuid: params.id }).catch(() => null);
	if (response?.status === 404) response = await client.users.getByPlatformId({ platformId: params.id }).catch(() => null);
	if (!response) throw error(503, "The CompCube API is unavailable.");
	if (response.status === 404) throw error(404, "Player not found.");
	if (!response.ok)
		throw error(response.status, "The player profile could not be loaded.");
	const user = await response.json();
	const layout = await parent();
	const canModerate = Boolean(layout.profile?.permissions.some((permission) => ["role:moderator", "role:admin", "role:dev"].includes(permission)));
	const historyResponse = canModerate
		? await client.moderation.timeouts({ userGuid: user.guid }).catch(() => null)
		: null;
	return {
		user,
		canModerate,
		timeoutHistory: historyResponse?.ok ? await historyResponse.json() : [],
	};
};

async function actionResult(response: Response | null, message: string) {
	if (!response?.ok) return fail(response?.status ?? 502, { message: "The moderation action was rejected." });
	return { success: true, message };
}

export const actions: Actions = {
	timeout: async ({ request, fetch, locals, params }) => {
		const form = await request.formData();
		const userGuid = String(form.get("userGuid") ?? params.id);
		const durationMinutes = Number(form.get("durationMinutes"));
		const endsAt = String(form.get("endsAt") ?? "").trim();
		const reason = String(form.get("reason") ?? "").trim();
		if (!reason || (!endsAt && (!Number.isInteger(durationMinutes) || durationMinutes < 1))) {
			return fail(400, { message: "Choose a timeout duration and enter a reason." });
		}
		return actionResult(await createApiClient(fetch, locals.authToken).moderation.timeout({
			userGuid,
			reason,
			durationMinutes: endsAt ? undefined : durationMinutes,
			endsAt: endsAt ? new Date(endsAt) : undefined,
		}).catch(() => null), "Timeout applied.");
	},
	removeTimeout: async ({ request, fetch, locals, params }) => {
		const userGuid = String((await request.formData()).get("userGuid") ?? params.id);
		return actionResult(await createApiClient(fetch, locals.authToken).moderation.removeTimeouts({ userGuid }).catch(() => null), "Active timeout removed.");
	},
	ban: async ({ request, fetch, locals, params }) => {
		const form = await request.formData();
		const reason = String(form.get("reason") ?? "").trim();
		const userGuid = String(form.get("userGuid") ?? params.id);
		if (!reason) return fail(400, { message: "A ban reason is required." });
		return actionResult(await createApiClient(fetch, locals.authToken).moderation.ban({ userGuid, reason }).catch(() => null), "User banned.");
	},
	unban: async ({ request, fetch, locals, params }) => {
		const userGuid = String((await request.formData()).get("userGuid") ?? params.id);
		return actionResult(await createApiClient(fetch, locals.authToken).moderation.unban({ userGuid }).catch(() => null), "Ban removed.");
	},
};
