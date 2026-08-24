export interface PluginDownload {
	version: string;
	label: string;
	file: string;
	description: string;
}

export const pluginDownloads: PluginDownload[] = [
	{
		version: "1.40.8",
		label: "Beat Saber 1.40.8",
		file: "/downloads/CompCube-1.40.8.dll",
		description: "Current PCVR release.",
	},
	{
		version: "1.39.1",
		label: "Beat Saber 1.39.1",
		file: "/downloads/CompCube-1.39.1.dll",
		description: "Legacy PCVR release.",
	},
];
