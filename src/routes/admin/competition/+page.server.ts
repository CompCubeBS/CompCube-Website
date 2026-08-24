import { createApiClient } from "$lib/api.server";
import { requireAuth } from "$lib/auth.svelte";
import { error, fail, type Actions } from "@sveltejs/kit";
import type { Permission } from "compcube-client";

export const load = requireAuth(async ({ fetch, locals, parent }) => {
	const layout = await parent();
	if (!layout.profile?.permissions.some((permission: Permission) => ["role:admin", "role:dev"].includes(permission))) throw error(403, "Administrator access is required.");
	const client = createApiClient(fetch, locals.authToken);
	const [seasonsResponse, currentResponse, queuesResponse, flairsResponse] = await Promise.all([client.seasons.list(), client.seasons.current().catch(() => null), client.queues.list(), client.flairs.list()]);
	const current = currentResponse?.ok ? await currentResponse.json() : null;
	const poolsResponse = current ? await client.pools.forSeason({ seasonGuid: current.guid }) : null;
	return { seasons: seasonsResponse.ok ? await seasonsResponse.json() : [], current, pools: poolsResponse?.ok ? await poolsResponse.json() : [], queues: queuesResponse.ok ? await queuesResponse.json() : [], flairs: flairsResponse.ok ? await flairsResponse.json() : [] };
});

async function result(response: Response | null, message: string) { if (!response?.ok) return fail(response?.status ?? 502, { message: "The API rejected this change." }); return { success: true, message }; }
export const actions: Actions = {
	createSeason: async ({ request, fetch, locals }) => { const form = await request.formData(); return result(await createApiClient(fetch, locals.authToken).seasons.create({ id: String(form.get("id")), name: String(form.get("name")), description: String(form.get("description") ?? "") || null, startingMmr: Number(form.get("startingMmr")), startsAt: new Date(String(form.get("startsAt"))).toISOString(), endsAt: form.get("endsAt") ? new Date(String(form.get("endsAt"))).toISOString() : null, isCurrent: form.get("isCurrent") === "on" }).catch(() => null), "Season created."); },
	updateSeason: async ({ request, fetch, locals }) => { const form = await request.formData(); return result(await createApiClient(fetch, locals.authToken).seasons.update({ seasonGuid: String(form.get("seasonGuid")), startingMmr: Number(form.get("startingMmr")), isCurrent: form.get("isCurrent") === "on" }).catch(() => null), "Season updated."); },
	createPool: async ({ request, fetch, locals }) => { const form = await request.formData(); return result(await createApiClient(fetch, locals.authToken).pools.create({ seasonGuid: String(form.get("seasonGuid")), name: String(form.get("name")), imageUrl: String(form.get("imageUrl") ?? "") || null, isPublic: form.get("isPublic") === "on" }).catch(() => null), "Map pool created."); },
	publishPool: async ({ request, fetch, locals }) => { const form = await request.formData(); return result(await createApiClient(fetch, locals.authToken).pools.publish({ poolGuid: String(form.get("poolGuid")), isPublic: form.get("isPublic") === "on" }).catch(() => null), "Pool visibility updated."); },
	createQueue: async ({ request, fetch, locals }) => { const form = await request.formData(); return result(await createApiClient(fetch, locals.authToken).queues.create({ slug: String(form.get("slug")), name: String(form.get("name")), poolGuid: String(form.get("poolGuid")), minMmr: Number(form.get("minMmr")), maxMmr: Number(form.get("maxMmr")), startingHealth: Number(form.get("startingHealth")), kFactor: Number(form.get("kFactor")), playerOneDecision: String(form.get("playerOneDecision")) as "lowest_mmr_first" | "highest_mmr_first" | "random", competitive: form.get("competitive") === "on", enabled: true }).catch(() => null), "Queue created."); },
	toggleQueue: async ({ request, fetch, locals }) => { const form = await request.formData(); return result(await createApiClient(fetch, locals.authToken).queues.update({ queueGuid: String(form.get("queueGuid")), enabled: form.get("enabled") === "on" }).catch(() => null), "Queue updated."); },
	createFlair: async ({ request, fetch, locals }) => { const form = await request.formData(); return result(await createApiClient(fetch, locals.authToken).flairs.create({ name: String(form.get("name")), color: String(form.get("color") ?? "") || null, imageUrl: String(form.get("imageUrl") ?? "") || null }).catch(() => null), "Flair created."); },
};
