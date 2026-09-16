import { createApiClient } from "$lib/api.server";
import { AUTH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "$lib/auth.svelte";
import { cookieDomain, jwtExpiresSoon } from "$lib/server/session";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	let accessToken = event.cookies.get(AUTH_TOKEN_COOKIE) ?? null;
	const refreshToken = event.cookies.get(REFRESH_TOKEN_COOKIE);

	if ((!accessToken || jwtExpiresSoon(accessToken)) && refreshToken) {
		const response = await createApiClient(event.fetch)
			.auth.refresh(refreshToken)
			.catch(() => null);
		if (response?.ok) {
			const token = await response.json();
			const options = {
				path: "/",
				domain: cookieDomain(event.url.hostname),
				httpOnly: true,
				secure: event.url.protocol === "https:",
				sameSite: "lax" as const,
			};
			accessToken = token.access_token;
			event.cookies.set(AUTH_TOKEN_COOKIE, token.access_token, {
				...options,
				maxAge: token.expires_in,
			});
			if (token.refresh_token) {
				event.cookies.set(REFRESH_TOKEN_COOKIE, token.refresh_token, {
					...options,
					maxAge: 365 * 24 * 60 * 60,
				});
			}
		} else if (response?.status === 401) {
			const options = {
				path: "/",
				domain: cookieDomain(event.url.hostname),
			};
			event.cookies.delete(AUTH_TOKEN_COOKIE, options);
			event.cookies.delete(REFRESH_TOKEN_COOKIE, options);
			accessToken = null;
		}
	}

	event.locals.authToken =
		accessToken && !jwtExpiresSoon(accessToken, 0) ? accessToken : null;
	return resolve(event);
};
