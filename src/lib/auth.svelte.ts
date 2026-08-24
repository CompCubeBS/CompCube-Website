import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { getContext, setContext } from "svelte";
import type { User } from "compcube-client";

export const AUTH_TOKEN_COOKIE = "cc_auth_token";
export const REFRESH_TOKEN_COOKIE = "cc_refresh_token";
export const OAUTH_STATE_COOKIE = "cc_oauth_state";
export const REDIRECT_AFTER_LOGIN_COOKIE = "cc_redirect_after_login";

const AUTH_CONTEXT_KEY = Symbol("compcube-auth");

export function initAuth(
	initialToken: string | null,
	initialProfile: User | null,
) {
	let token = $state(initialToken);
	let profile = $state(initialProfile);
	let error = $state<string | null>(null);

	const isAuthenticated = $derived(Boolean(token));

	function login(returnTo?: string) {
		if (!browser) return;
		const target = returnTo ?? `${page.url.pathname}${page.url.search}`;
		window.location.assign(
			`/auth/login?returnTo=${encodeURIComponent(target)}`,
		);
	}

	async function logout() {
		if (!browser) return;
		try {
			await fetch("/auth/logout", { method: "POST" });
		} catch {
			error =
				"The logout request failed. Your local session has still been cleared.";
		}
		token = null;
		profile = null;
		await goto("/");
	}

	function hydrate(nextToken: string | null, nextProfile: User | null) {
		token = nextToken;
		profile = nextProfile;
	}

	const auth = {
		get token() {
			return token;
		},
		get profile() {
			return profile;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},
		get error() {
			return error;
		},
		hydrate,
		login,
		logout,
	};

	setContext(AUTH_CONTEXT_KEY, auth);
	return auth;
}

export function useAuth() {
	return getContext<ReturnType<typeof initAuth>>(AUTH_CONTEXT_KEY);
}

export function requireAuth<T extends Record<string, unknown>>(
	handler: (
		event: Parameters<import("@sveltejs/kit").ServerLoad>[0],
	) => Promise<T> | T,
): import("@sveltejs/kit").ServerLoad {
	return async (event) => {
		const token =
			event.locals.authToken ?? event.cookies.get(AUTH_TOKEN_COOKIE);
		if (!token) {
			event.cookies.set(
				REDIRECT_AFTER_LOGIN_COOKIE,
				`${event.url.pathname}${event.url.search}`,
				{
					path: "/",
					maxAge: 600,
					httpOnly: true,
					sameSite: "lax",
					secure: event.url.protocol === "https:",
				},
			);
			const { redirect } = await import("@sveltejs/kit");
			throw redirect(303, "/auth/login");
		}

		return handler(event);
	};
}
