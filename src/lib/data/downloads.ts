export interface PluginDownload {
	gameVersion: string;
	pluginVersion: string;
	label: string;
	downloadUrl: string;
	description: string;
	sha256: string;
	size: number;
	uploadedAt: string;
}

export interface PluginReleaseResponse {
	servedPluginVersion: string | null;
	releases: Omit<PluginDownload, "label" | "description">[];
}

export function asPluginDownloads(response: PluginReleaseResponse | null): PluginDownload[] {
	return (response?.releases ?? []).map((release, index) => ({
		...release,
		label: `Beat Saber ${release.gameVersion}`,
		description: `${index === 0 ? "Current" : "Supported"} CompCube ${release.pluginVersion} build.`,
	}));
}
