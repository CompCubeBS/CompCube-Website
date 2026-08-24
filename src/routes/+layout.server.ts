import { createApiClient } from "$lib/api.server";
import { AUTH_TOKEN_COOKIE } from "$lib/auth.svelte";
import type { LayoutServerLoad } from "./$types";
import type { User } from "compcube-client";

export const load: LayoutServerLoad = async ({
	cookies,
	fetch,
	locals,
	url,
}) => {
	const token = locals.authToken;
	let profile: User | null = null;

	if (token) {
		const response = await createApiClient(fetch, token).account.me().catch(() => null);
		if (response?.ok) profile = (await response.json()).user;
		else if (response?.status === 401) {
			cookies.delete(AUTH_TOKEN_COOKIE, { path: "/" });
			locals.authToken = null;
		}
	}

	return { authToken: locals.authToken, profile };
};
