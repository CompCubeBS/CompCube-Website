import {
	AUTH_TOKEN_COOKIE,
	OAUTH_STATE_COOKIE,
	REDIRECT_AFTER_LOGIN_COOKIE,
	REFRESH_TOKEN_COOKIE,
} from "$lib/auth.svelte";
import { cookieDomain } from "$lib/server/session";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = ({ cookies, url }) => {
	const options = { path: "/", domain: cookieDomain(url.hostname) };
	for (const name of [
		AUTH_TOKEN_COOKIE,
		REFRESH_TOKEN_COOKIE,
		OAUTH_STATE_COOKIE,
		REDIRECT_AFTER_LOGIN_COOKIE,
	]) {
		cookies.delete(name, options);
	}
	return new Response(null, { status: 204 });
};
