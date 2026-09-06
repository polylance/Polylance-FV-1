export interface AlertNotification {
  title: string;
  body: string;
  contractAddress: string;
}

export async function notifyAdmins(alert: AlertNotification): Promise<boolean> {
  const discordWebhookUrl = process.env.DISCORD_ADMIN_WEBHOOK_URL;
  if (!discordWebhookUrl || discordWebhookUrl === "your_discord_webhook_here") {
    console.log(`[ADMIN NOTIFICATION LOG] (Discord URL unconfigured): ${alert.title} - ${alert.body}`);
    return false;
  }

  try {
    const res = await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `🚨 ${alert.title}`,
            description: alert.body,
            fields: [{ name: "Contract", value: alert.contractAddress }],
            color: 0xdc2626, // red
          },
        ],
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to post Discord admin notification:", err);
    return false;
  }
}
