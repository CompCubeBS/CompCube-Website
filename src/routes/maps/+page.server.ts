import { createApiClient } from "$lib/api.server";
import { fail, type Actions } from "@sveltejs/kit";
import type { Difficulty, MapModifier, SeasonPool } from "compcube-client";
import type { PageServerLoad } from "./$types";

const difficulties: Difficulty[] = ["Easy", "Normal", "Hard", "Expert", "ExpertPlus"];
const modifiers: MapModifier[] = ["NF", "NW", "NB", "NA", "SS", "FS", "SFS", "IF", "4L", "DA", "GN", "PM", "SA", "SN", "ZM"];

export const load: PageServerLoad = async ({ fetch, locals, parent, url }) => {
	const client = createApiClient(fetch, locals.authToken);
	const layout = await parent();
	const seasonResponse = await client.seasons.current().catch(() => null);
	const season = seasonResponse?.ok ? await seasonResponse.json() : null;
	const poolsResponse = season ? await client.pools.forSeason({ seasonGuid: season.guid }).catch(() => null) : null;
	const pools = poolsResponse?.ok ? await poolsResponse.json() : [] as SeasonPool[];
	const selectedPool = pools.find((pool) => pool.guid === url.searchParams.get("pool")) ?? pools.find((pool) => pool.isPublic) ?? pools[0] ?? null;
	const mapsResponse = selectedPool ? await client.maps.forPool({ poolGuid: selectedPool.guid }).catch(() => null) : null;
	const flairsResponse = await client.flairs.list().catch(() => null);
	return {
		season,
		pools,
		selectedPool,
		maps: mapsResponse?.ok ? await mapsResponse.json() : [],
		flairs: flairsResponse?.ok ? await flairsResponse.json() : [],
		canManage: Boolean(layout.profile?.permissions.some((permission) => ["role:pooler", "role:admin", "role:dev"].includes(permission))),
		difficulties,
		modifiers,
		apiAvailable: Boolean(seasonResponse && poolsResponse),
	};
};

export const actions: Actions = {
	add: async ({ request, fetch, locals }) => {
		if (!locals.authToken) return fail(401, { message: "Sign in before managing maps." });
		const form = await request.formData();
		const poolGuid = String(form.get("poolGuid") ?? "");
		const key = String(form.get("key") ?? "").trim();
		const characteristic = String(form.get("characteristic") ?? "Standard").trim();
		const difficulty = String(form.get("difficulty") ?? "") as Difficulty;
		const selectedModifiers = form.getAll("modifiers").map(String) as MapModifier[];
		const flairGuid = String(form.get("flairGuid") ?? "") || null;
		if (!poolGuid || !key || !characteristic || !difficulties.includes(difficulty) || selectedModifiers.some((modifier) => !modifiers.includes(modifier))) return fail(400, { message: "The map request is invalid." });
		const response = await createApiClient(fetch, locals.authToken).maps.create({ poolGuid, key, characteristic, difficulty, modifiers: selectedModifiers, flairGuid }).catch(() => null);
		if (!response?.ok) return fail(response?.status ?? 502, { message: response ? "BeatSaver rejected the map or difficulty." : "The CompCube API is unavailable." });
		return { success: true, message: "Map added from BeatSaver." };
	},
	remove: async ({ request, fetch, locals }) => {
		if (!locals.authToken) return fail(401, { message: "Sign in before managing maps." });
		const mapGuid = String((await request.formData()).get("mapGuid") ?? "");
		const response = await createApiClient(fetch, locals.authToken).maps.remove({ mapGuid }).catch(() => null);
		if (!response?.ok) return fail(response?.status ?? 502, { message: "The map could not be removed." });
		return { success: true, message: "Map removed." };
	},
};
