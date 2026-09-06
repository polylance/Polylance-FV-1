import type { Client, Conversation } from "@xmtp/browser-sdk";

export async function getOrCreateNegotiationChat(
  client: Client,
  counterpartyAddress: string
): Promise<Conversation> {
  // XMTP V3 MLS DM creation helper
  // In V3, newDm takes counterparty address / inboxId
  const conversation = await client.conversations.newDm(counterpartyAddress);
  return conversation;
}

export async function sendMessage(conversation: Conversation, text: string): Promise<void> {
  await conversation.send(text);
}

export async function listMessages(conversation: Conversation): Promise<unknown[]> {
  const messages = await conversation.messages();
  return messages;
}

export function streamMessages(
  conversation: Conversation,
  onMessage: (msg: unknown) => void
): () => void {
  let isCancelled = false;

  (async () => {
    try {
      const stream = await conversation.stream();
      for await (const message of stream) {
        if (isCancelled) break;
        onMessage(message);
      }
    } catch (err) {
      if (!isCancelled) {
        console.warn("XMTP message stream error:", err);
      }
    }
  })();

  return () => {
    isCancelled = true;
  };
}
