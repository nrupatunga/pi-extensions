import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Define your models here
  const models = [
    { label: "Sonnet", provider: "anthropic", model: "claude-sonnet-4-20250514", thinking: "medium" },
    { label: "Opus 4.5", provider: "anthropic", model: "claude-opus-4-5", thinking: "medium" },
    { label: "Opus 4.6", provider: "anthropic", model: "claude-opus-4-6", thinking: "medium" },
    { label: "GPT-5.2", provider: "openai-codex", model: "gpt-5.2", thinking: "medium" },
    { label: "Codex 5.3", provider: "openai-codex", model: "gpt-5.3-codex", thinking: "medium" },
  ];

  pi.registerShortcut("ctrl+space", {
    description: `Cycle through ${models.length} models`,
    handler: async (ctx) => {
      // Get current model from model registry
      const currentModel = ctx.model;
      
      // Find current index
      let currentIndex = models.findIndex(
        (m) => m.provider === currentModel.provider && m.model === currentModel.id
      );
      
      // If not found, start at -1 so next will be 0
      if (currentIndex === -1) currentIndex = -1;
      
      // Cycle to next
      const nextIndex = (currentIndex + 1) % models.length;
      const selected = models[nextIndex];
      
      // Find the model in registry
      const targetModel = ctx.modelRegistry.find(selected.provider, selected.model);
      if (!targetModel) {
        ctx.ui.notify(`Model not found: ${selected.provider}/${selected.model}`, "error");
        return;
      }
      
      // Switch to the selected model
      const success = await pi.setModel(targetModel);
      if (!success) {
        ctx.ui.notify(`No API key for ${selected.label}`, "error");
        return;
      }
      
      // Set thinking level if specified
      if (selected.thinking) {
        pi.setThinkingLevel(selected.thinking as any);
      }

      ctx.ui.notify(
        `Switched to ${selected.label} (thinking: ${selected.thinking || 'default'})`,
        "success"
      );
    },
  });
}
