import { createApiClient } from "$lib/api";
import { redirect, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = ({ fetch, url }) => {
	const requestedReturn = url.searchParams.get("returnTo") ?? "/";
	const returnTo =
		requestedReturn.startsWith("/") && !requestedReturn.startsWith("//")
			? requestedReturn
			: "/";
	throw redirect(303, createApiClient(fetch).auth.loginUrl({ returnTo }));
};
