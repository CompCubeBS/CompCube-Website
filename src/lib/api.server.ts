import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { CompCubeClient } from "compcube-client";

function instrumentedFetch(
	fetchImplementation: typeof globalThis.fetch,
	authToken?: string | null,
): typeof globalThis.fetch {
	return async (input, init) => {
		const headers = new Headers(
			input instanceof Request ? input.headers : undefined,
		);
		new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
		const normalizedToken = authToken?.trim().replace(/^Bearer\s+/i, "");
		if (normalizedToken && !headers.has("authorization")) {
			headers.set("authorization", `Bearer ${normalizedToken}`);
		}
		const requestId = headers.get("x-request-id") ?? crypto.randomUUID();
		headers.set("x-request-id", requestId);
		const authorization = headers.get("authorization");
		const bearerTokenPresent = Boolean(
			authorization?.match(/^Bearer[ \t]+(.+)$/i)?.[1]?.trim(),
		);
		const requestUrl = new URL(
			input instanceof Request ? input.url : input.toString(),
		);
		const startedAt = performance.now();

		try {
			const response = await fetchImplementation(input, { ...init, headers });
			console.info(JSON.stringify({
				timestamp: new Date().toISOString(),
				type: "website_api_request",
				requestId,
				method: init?.method ?? (input instanceof Request ? input.method : "GET"),
				origin: requestUrl.origin,
				path: requestUrl.pathname,
				status: response.status,
				durationMs: Number((performance.now() - startedAt).toFixed(2)),
				authorizationPresent: Boolean(authorization),
				bearerTokenPresent,
				apiRequestId: response.headers.get("x-request-id"),
			}));
			return response;
		} catch (error) {
			console.error(JSON.stringify({
				timestamp: new Date().toISOString(),
				type: "website_api_request",
				requestId,
				method: init?.method ?? (input instanceof Request ? input.method : "GET"),
				origin: requestUrl.origin,
				path: requestUrl.pathname,
				status: null,
				durationMs: Number((performance.now() - startedAt).toFixed(2)),
				authorizationPresent: Boolean(authorization),
				bearerTokenPresent,
				networkError: error instanceof Error ? error.name : "UnknownError",
			}));
			throw error;
		}
	};
}

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
		fetch: instrumentedFetch(fetchImplementation, token),
		authToken: token,
	});
}
