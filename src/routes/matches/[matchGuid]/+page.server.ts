import { createApiClient } from "$lib/api.server";
import { error, fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, locals, params, parent }) => {
	const response = await createApiClient(fetch, locals.authToken).matches.get({ matchGuid: params.matchGuid }).catch(() => null);
	if (!response) throw error(503, "The CompCube API is unavailable.");
	if (response.status === 404) throw error(404, "Match not found.");
	if (!response.ok) throw error(response.status, "The match could not be loaded.");
	const layout = await parent();
	return { match: await response.json(), canModerate: Boolean(layout.profile?.permissions.some((permission) => ["role:moderator", "role:admin", "role:dev"].includes(permission))), isAdmin: Boolean(layout.profile?.permissions.some((permission) => ["role:admin", "role:dev"].includes(permission))) };
};

async function result(response: Response | null, success: string) {
	if (!response?.ok) return fail(response?.status ?? 502, { message: response ? "The match action was rejected." : "The CompCube API is unavailable." });
	return { success: true, message: success };
}

export const actions: Actions = {
	pause: async ({ fetch, locals, params }) => result(await createApiClient(fetch, locals.authToken).moderation.pause({ matchGuid: String(params.matchGuid) }).catch(() => null), "Match paused."),
	resume: async ({ fetch, locals, params }) => result(await createApiClient(fetch, locals.authToken).moderation.resume({ matchGuid: String(params.matchGuid) }).catch(() => null), "Match resumed."),
	abort: async ({ request, fetch, locals, params }) => {
		const reason = String((await request.formData()).get("reason") ?? "").trim();
		if (!reason) return fail(400, { message: "An abort reason is required." });
		return result(await createApiClient(fetch, locals.authToken).moderation.abort({ matchGuid: String(params.matchGuid), reason }).catch(() => null), "Match cancelled.");
	},
	setHealth: async ({ request, fetch, locals, params }) => {
		const form = await request.formData(); const targetUserGuid = String(form.get("userGuid") ?? ""); const health = Number(form.get("health"));
		if (!targetUserGuid || !Number.isFinite(health) || health < 0) return fail(400, { message: "Health must be non-negative." });
		return result(await createApiClient(fetch, locals.authToken).moderation.decision({ matchGuid: String(params.matchGuid), action: "set_health", targetUserGuid, health, reason: "Administrative health correction" }).catch(() => null), "Health corrected.");
	},
	adjustMmr: async ({ request, fetch, locals, params }) => {
		const form = await request.formData(); const winnerMmrGain = Number(form.get("winnerMmrGain")); const loserMmrLoss = Number(form.get("loserMmrLoss"));
		return result(await createApiClient(fetch, locals.authToken).moderation.adjustResult({ matchGuid: String(params.matchGuid), winnerMmrGain, loserMmrLoss }).catch(() => null), "Final MMR changes corrected.");
	},
	undo: async ({ fetch, locals, params }) => result(await createApiClient(fetch, locals.authToken).moderation.undoResult({ matchGuid: String(params.matchGuid) }).catch(() => null), "Match result reverted."),
	declareWinner: async ({ request, fetch, locals, params }) => {
		const form = await request.formData();
		const winnerUserGuid = String(form.get("winnerUserGuid") ?? "");
		const winnerMmrGain = Number(form.get("winnerMmrGain"));
		const loserMmrLoss = Number(form.get("loserMmrLoss"));
		const reason = String(form.get("reason") ?? "").trim();
		if (!winnerUserGuid || !reason) return fail(400, { message: "Choose a winner and enter a reason." });
		return result(await createApiClient(fetch, locals.authToken).moderation.decision({
			matchGuid: String(params.matchGuid), action: "declare_winner", winnerUserGuid, winnerMmrGain, loserMmrLoss, reason,
		}).catch(() => null), "Winner and final MMR changes applied.");
	},
};
