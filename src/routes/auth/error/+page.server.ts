import type { PageServerLoad } from "./$types";

const messages: Record<string, string> = {
	login_disabled:
		"CompCube login is temporarily disabled because the BeatKhana signing key is unavailable.",
	login_not_configured: "CompCube login has not been configured yet.",
	oauth_authorization_failed:
		"BeatKhana did not authorize the login request.",
	oauth_access_denied:
		"You denied the BeatKhana authorization request.",
	oauth_state_mismatch:
		"The login request could not be verified. Please start again.",
	beatkhana_platform_id_missing:
		"Link a BeatLeader or ScoreSaber account to BeatKhana before signing in.",
	compcube_user_already_linked:
		"That CompCube player is already linked to another Discord account.",
	discord_account_already_linked:
		"That Discord account is already linked to another CompCube player.",
	ambiguous_platform_identity:
		"Your linked platform IDs point to more than one CompCube player.",
	beatkhana_unavailable:
		"BeatKhana could not be reached. Please try again shortly.",
};

export const load: PageServerLoad = ({ url }) => {
	const reason = url.searchParams.get("reason") ?? "unknown";
	return {
		message:
			messages[reason] ??
			"Login could not be completed. Please try again.",
	};
};
