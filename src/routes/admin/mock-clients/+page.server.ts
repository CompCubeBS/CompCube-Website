import { createApiClient } from "$lib/api.server";
import { requireAuth } from "$lib/auth.svelte";
import { error, fail, type Actions } from "@sveltejs/kit";
import type { MockClientAction, Permission } from "compcube-client";

export const load = requireAuth(async ({ fetch, locals, parent }) => {
	const layout = await parent();
	if (!layout.profile?.permissions.includes("role:dev" as Permission)) throw error(403, "Developer access is required.");
	const client = createApiClient(fetch, locals.authToken);
	const [clientsResponse, queuesResponse] = await Promise.all([
		client.mockClients.list(),
		client.queues.list(),
	]);
	if (!clientsResponse.ok || !queuesResponse.ok) throw error(502, "Mock client data could not be loaded.");
	return { clients: await clientsResponse.json(), queues: await queuesResponse.json() };
});

async function responseResult(response: Response | null, success: string) {
	if (!response?.ok) return fail(response?.status ?? 502, { message: "The mock client action was rejected." });
	return { success: true, message: success };
}

export const actions: Actions = {
	create: async ({ request, fetch, locals }) => {
		const form = await request.formData();
		return responseResult(await createApiClient(fetch, locals.authToken).mockClients.createMatch({
			redPlatformId: String(form.get("redPlatformId") ?? "").trim(),
			bluePlatformId: String(form.get("bluePlatformId") ?? "").trim(),
			queueGuid: String(form.get("queueGuid") ?? ""),
		}).catch(() => null), "Mock match created.");
	},
	act: async ({ request, fetch, locals }) => {
		const form = await request.formData();
		const clientGuid = String(form.get("clientGuid") ?? "");
		const actionName = String(form.get("actionName") ?? "");
		let action: MockClientAction;
		if (actionName === "discard") {
			action = { action: "discard", mapGuids: form.getAll("mapGuids").map(String) };
		} else if (actionName === "pick") {
			action = { action: "pick", mapGuid: String(form.get("mapGuid") ?? "") };
		} else if (actionName === "score") {
			const rawScore = Number(form.get("rawScore"));
			const reported = Number(form.get("modifiedScore"));
			action = {
				action: "score",
				roundGuid: String(form.get("roundGuid") ?? ""),
				rawScore,
				modifiedScore: Number.isInteger(reported) ? reported : rawScore,
				noFailTriggered: form.get("noFailTriggered") === "on",
				proMode: form.get("proMode") === "on",
				missCount: Number(form.get("missCount")),
				fullCombo: form.get("fullCombo") === "on",
			};
		} else if (actionName === "forfeit" || actionName === "disconnect") {
			action = { action: actionName };
		} else {
			return fail(400, { message: "Unknown mock client action." });
		}
		return responseResult(await createApiClient(fetch, locals.authToken).mockClients.action({ clientGuid, action }).catch(() => null), "Mock client updated.");
	},
};
