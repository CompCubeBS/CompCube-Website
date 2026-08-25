import { createApiClient } from "$lib/api.server";
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
	const categoriesResponse = await client.mapCategories.list().catch(() => null);
	return {
		season,
		pools,
		selectedPool,
		maps: mapsResponse?.ok ? await mapsResponse.json() : [],
		categories: categoriesResponse?.ok ? await categoriesResponse.json() : [],
		canManage: Boolean(layout.profile?.permissions.some((permission) => ["role:pooler", "role:admin", "role:dev"].includes(permission))),
		difficulties,
		modifiers,
		apiAvailable: Boolean(seasonResponse && poolsResponse),
	};
};
