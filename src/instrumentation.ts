export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { autoSyncTelegramWebhook } = await import("@/services/telegram/sync");
      await autoSyncTelegramWebhook();
    } catch (err) {
      console.error("[Instrumentation Auto-Sync Error]", err);
    }
  }
}
