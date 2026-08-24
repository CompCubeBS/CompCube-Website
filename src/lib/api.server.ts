import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { CompCubeClient } from "compcube-client";

/**
 * Creates an API client for SvelteKit server loads and actions.
 * Docker uses the private service URL while browsers continue to use the public API URL.
 */
export function createApiClient(
	fetchImplementation: typeof globalThis.fetch,
	token?: string | null,
) {
	return new CompCubeClient({
		baseUrl:
			privateEnv.COMPCUBE_INTERNAL_API_URL ||
			publicEnv.PUBLIC_COMPCUBE_API_URL ||
			"https://api.compcube.net",
		socketUrl:
			publicEnv.PUBLIC_COMPCUBE_SOCKET_URL ||
			publicEnv.PUBLIC_COMPCUBE_API_URL ||
			"https://api.compcube.net",
		fetch: fetchImplementation,
		authToken: token,
	});
}
