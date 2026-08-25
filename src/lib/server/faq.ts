export interface FaqItem {
	question: string;
	answer: string;
	icon?: string;
}

export const faqItems: FaqItem[] = [
	{
		question: "What is CompCube?",
		answer: "CompCube is a competitive Beat Saber matchmaking system. Join a queue in-game, play a structured pick-and-ban match, and build your rating over time.",
		icon: "pi pi-sparkles",
	},
	{
		question: "How do I start playing?",
		answer: "Download the DLL for your Beat Saber version, place it in the game Plugins folder, and launch the game through your normal modded setup. The CompCube menu will appear in-game.",
		icon: "pi pi-play",
	},
	{
		question: "Why do I log in with BeatKhana?",
		answer: "BeatKhana provides the account identity used by CompCube. Your linked BeatLeader or ScoreSaber ID connects that account to your CompCube ranking without sharing provider credentials with this website.",
		icon: "pi pi-lock",
	},
	{
		question: "How does matchmaking work?",
		answer: "Choose a queue in the mod and wait for an opponent. Once matched, both players work through the displayed map selection phase before playing the remaining maps.",
		icon: "pi pi-users",
	},
	{
		question: "What does MMR represent?",
		answer: "MMR is the rating used to order the leaderboard and find competitive opponents. Match results change it based on the players involved and the final result.",
		icon: "pi pi-arrow-up-right",
	},
	{
		question: "What happens if I disconnect from a match?",
		answer: "Disconnecting or leaving an active match is an immediate forfeit with the normal MMR result. It also prevents you from queueing for an escalating timeout: 15 minutes for the first disconnect, then 30 minutes, 1 hour, 2 hours, 4 hours, 8 hours, 16 hours, 32 hours, and so on. Each timeout is double the previous step. Only disconnects from the preceding 14 days count when the next timeout is calculated, so older disconnects automatically fall out of the rolling window. Moderator-issued timeouts do not increase this sequence.",
		icon: "pi pi-clock",
	},
	{
		question: "Which Beat Saber versions are supported?",
		answer: "The website currently provides PCVR downloads for Beat Saber 1.39.1 and 1.40.8. Select the matching version before downloading the plugin.",
		icon: "pi pi-desktop",
	},
	{
		question: "Where can I get help?",
		answer: "Join the CompCube Discord for setup help, matchmaking support, announcements, and community discussion.",
		icon: "pi pi-discord",
	},
];
