import { env } from "$env/dynamic/public";
import { CompCubeClient } from "compcube-client";

export function createApiClient(
	fetchImplementation: typeof globalThis.fetch,
	token?: string | null,
) {
	const client = new CompCubeClient({
		baseUrl: env.PUBLIC_COMPCUBE_API_URL || "https://api.compcube.net",
		socketUrl: env.PUBLIC_COMPCUBE_SOCKET_URL || "https://api.compcube.net",
		fetch: fetchImplementation,
		authToken: token,
	});
	return client;
}
