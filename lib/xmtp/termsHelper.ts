import { Conversation } from "@xmtp/browser-sdk";
import { sendMessage } from "./negotiation";

export interface TermsData {
  jobAddress: string;
  termsHash: string;
  scopeDescription: string;
  agreedAmount: string; // ETH / MATIC
  deadlineDays: number;
}

export function formatTermsSummaryMessage(terms: TermsData, proposer: string): string {
  return [
    `📜 **Terms Proposed by ${proposer.slice(0, 6)}...${proposer.slice(-4)}**`,
    `• **Job Contract**: \`${terms.jobAddress}\``,
    `• **Agreed Amount**: ${terms.agreedAmount}`,
    `• **Deadline**: ${terms.deadlineDays} days`,
    `• **Scope Summary**: ${terms.scopeDescription}`,
    `• **On-Chain Terms Hash**: \`${terms.termsHash}\``,
    `\n*Please review these terms before confirming your signature on-chain.*`,
  ].join("\n");
}

export async function sendTermsProposalSummary(
  conversation: Conversation,
  terms: TermsData,
  proposerAddress: string
): Promise<void> {
  const messageText = formatTermsSummaryMessage(terms, proposerAddress);
  await sendMessage(conversation, messageText);
}
