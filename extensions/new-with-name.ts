import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.registerCommand("n", {
		description: "New session, optionally named (/n my-session)",
		handler: async (args, ctx) => {
			const result = await ctx.newSession();
			if (result.cancelled) return;

			const name = args?.trim();
			if (name) {
				pi.setSessionName(name);
				ctx.ui.notify(`New session: ${name}`, "info");
			}
		},
	});
}
