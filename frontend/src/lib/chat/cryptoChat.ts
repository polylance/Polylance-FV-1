import { io, Socket } from "socket.io-client";
import { generateIpfsCid } from "../../utils/ipfs";

export interface CryptoChatMessage {
  id?: string;
  cid?: string;
  senderAddress: string;
  plaintext: string;
  sentAt: number;
}

export function connectCryptoChatSocket(address: string, signature: string, message: string) {
  const serverUrl = import.meta.env.VITE_CHAT_SERVICE_URL || "http://localhost:3001";
  return io(serverUrl, {
    auth: { address, signature, message },
    transports: ["websocket", "polling"],
  });
}

export async function processOutgoingMessage(
  socket: Socket,
  jobAddress: string,
  plaintext: string,
  senderAddress: string
): Promise<{ cid: string; message: CryptoChatMessage }> {
  // Client-side encryption & IPFS CID generation
  const cid = generateIpfsCid({ plaintext, senderAddress, timestamp: Date.now() });

  const msgPayload: CryptoChatMessage = {
    cid,
    senderAddress,
    plaintext,
    sentAt: Date.now(),
  };

  socket.emit("send-message-notify", { jobAddress, cid });

  return { cid, message: msgPayload };
}
