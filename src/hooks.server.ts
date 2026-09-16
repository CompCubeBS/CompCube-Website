import { createApiClient } from "$lib/api.server";
import { AUTH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "$lib/auth.svelte";
import { cookieDomain, jwtExpiresSoon } from "$lib/server/session";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	let accessToken = event.cookies.get(AUTH_TOKEN_COOKIE) ?? null;
	const refreshToken = event.cookies.get(REFRESH_TOKEN_COOKIE);
	const initialAccessCookiePresent = Boolean(accessToken);
	const initialAccessTokenExpiresSoon = Boolean(
		accessToken && jwtExpiresSoon(accessToken),
	);
	let refreshAttempted = false;
	let refreshStatus: number | "network_error" | null = null;

	if ((!accessToken || jwtExpiresSoon(accessToken)) && refreshToken) {
		refreshAttempted = true;
		const response = await createApiClient(event.fetch)
			.auth.refresh(refreshToken)
			.catch(() => null);
		refreshStatus = response?.status ?? "network_error";
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
	const response = await resolve(event);
	const isDocumentRequest =
		event.request.headers.get("sec-fetch-dest") === "document";
	if (isDocumentRequest || initialAccessCookiePresent || refreshToken) {
		console.info(JSON.stringify({
			timestamp: new Date().toISOString(),
			type: "website_auth_session",
			requestId:
				event.request.headers.get("cf-ray") ??
				event.request.headers.get("x-request-id") ??
				null,
			hostname: event.url.hostname,
			path: event.url.pathname,
			status: response.status,
			cookieHeaderPresent: Boolean(event.request.headers.get("cookie")),
			accessCookiePresent: initialAccessCookiePresent,
			refreshCookiePresent: Boolean(refreshToken),
			accessTokenExpiresSoon: initialAccessTokenExpiresSoon,
			refreshAttempted,
			refreshStatus,
			apiBearerAvailable: Boolean(event.locals.authToken),
		}));
	}
	return response;
};
