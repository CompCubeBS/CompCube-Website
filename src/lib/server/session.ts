export function readJwtDiscordId(token: string): string | null {
	try {
		const part = token.split(".")[1];
		if (!part) return null;
		const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
		const normalized = base64.padEnd(
			base64.length + ((4 - (base64.length % 4)) % 4),
			"=",
		);
		const binary = atob(normalized);
		const bytes = Uint8Array.from(binary, (character) =>
			character.charCodeAt(0),
		);
		const payload = JSON.parse(new TextDecoder().decode(bytes)) as {
			id?: unknown;
			exp?: unknown;
		};
		if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now())
			return null;
		return typeof payload.id === "string" ? payload.id : null;
	} catch {
		return null;
	}
}

export function cookieDomain(hostname: string): string | undefined {
	return hostname === "compcube.net" || hostname.endsWith(".compcube.net")
		? ".compcube.net"
		: undefined;
}

/** Returns true shortly before JWT expiry so server-side requests can refresh safely. */
export function jwtExpiresSoon(
	token: string,
	leewayMilliseconds = 30_000,
): boolean {
	try {
		const part = token.split(".")[1];
		if (!part) return false;
		const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
		const normalized = base64.padEnd(
			base64.length + ((4 - (base64.length % 4)) % 4),
			"=",
		);
		const payload = JSON.parse(atob(normalized)) as { exp?: unknown };
		return (
			typeof payload.exp === "number" &&
			payload.exp * 1000 <= Date.now() + leewayMilliseconds
		);
	} catch {
		return false;
	}
}
