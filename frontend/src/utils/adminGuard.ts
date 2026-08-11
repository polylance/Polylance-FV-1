/**
 * adminGuard.ts
 * All privileged-address lookups go through here.
 * Addresses are loaded exclusively from VITE_ env vars — nothing is hardcoded in source.
 */

/** Returns the list of admin addresses (lowercase) from env vars VITE_ADMIN_ADDRESS_1..N */
function getAdminAddresses(): string[] {
  const addrs: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const val = (import.meta.env[`VITE_ADMIN_ADDRESS_${i}`] as string | undefined)?.toLowerCase().trim();
    if (val && val.startsWith('0x') && val.length === 42) {
      addrs.push(val);
    }
  }
  return addrs;
}

/** Returns the judge address (lowercase) from env. */
function getJudgeAddress(): string {
  return ((import.meta.env.VITE_JUDGE_ADDRESS as string | undefined) ?? '').toLowerCase().trim();
}

/** Returns true if the given wallet address matches any registered admin address. */
export function isAdminAddress(address: string): boolean {
  if (!address) return false;
  return getAdminAddresses().includes(address.toLowerCase().trim());
}

/** Returns true if the given wallet address matches the judge address. */
export function isJudgeAddress(address: string): boolean {
  if (!address) return false;
  const judgeAddr = getJudgeAddress();
  return judgeAddr.length > 0 && address.toLowerCase().trim() === judgeAddr;
}

/** Returns 'admin' | 'judge' | null based purely on address matching env vars. */
export function detectPrivilegedRole(address: string): 'admin' | 'judge' | null {
  if (!address) return null;
  if (isJudgeAddress(address)) return 'judge';
  if (isAdminAddress(address)) return 'admin';
  return null;
}
