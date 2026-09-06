import { useState, useEffect } from "react";
import { canMessage } from "../lib/xmtp/reachability";
import { getXmtpClient } from "../lib/xmtp/client";
import { getOrCreateNegotiationChat, listMessages, sendMessage, streamMessages } from "../lib/xmtp/negotiation";
import { acquireTabLock } from "../lib/xmtp/tabLock";
import type { Conversation } from "@xmtp/browser-sdk";

export function useNegotiationChat(counterpartyAddress: string) {
  const [messages, setMessages] = useState<unknown[]>([]);
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [tabLocked, setTabLocked] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    if (!counterpartyAddress) {
      setReachable(false);
      return;
    }

    acquireTabLock(
      async () => {
        if (cancelled) return;

        const isReachable = await canMessage(counterpartyAddress);
        if (cancelled) return;
        setReachable(isReachable);
        if (!isReachable) return;

        const client = getXmtpClient();
        if (!client) return;

        try {
          const convo = await getOrCreateNegotiationChat(client, counterpartyAddress);
          if (cancelled) return;
          setConversation(convo);

          const history = await listMessages(convo);
          if (cancelled) return;
          setMessages(history);

          const unsubscribe = streamMessages(convo, (newMsg) => {
            setMessages((prev) => [...prev, newMsg]);
          });

          return () => {
            unsubscribe();
          };
        } catch (err) {
          console.warn("XMTP negotiation chat initialization error:", err);
        }
      },
      () => {
        // Tab lock conflict: Chat is open in another tab
        if (!cancelled) {
          setTabLocked(true);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [counterpartyAddress]);

  async function send(text: string) {
    if (!conversation || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage(conversation, text);
    } finally {
      setSending(false);
    }
  }

  return { messages, reachable, send, sending, tabLocked, conversation };
}
