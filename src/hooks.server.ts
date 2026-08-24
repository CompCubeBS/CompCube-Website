import { AUTH_TOKEN_COOKIE } from "$lib/auth.svelte";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.authToken = event.cookies.get(AUTH_TOKEN_COOKIE) ?? null;
	return resolve(event);
};
