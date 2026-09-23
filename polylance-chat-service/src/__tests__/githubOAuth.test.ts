import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { app, server, setPrismaInstance, verifyAndBindGithubOAuth, getSharedState } from "../server.js";

const TEST_PORT = 3012;
const SERVER_URL = `http://localhost:${TEST_PORT}`;

const mockPrisma = {
  profileRecord: {
    upsert: async () => ({}),
    findUnique: async () => null,
  },
  protocolSharedState: {
    upsert: async () => ({}),
    findUnique: async () => null,
  },
};

describe("GitHub OAuth 2.0 & Sybil Resistance Security Suite", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    setPrismaInstance(mockPrisma as any);
    await new Promise<void>((resolve) => {
      server.listen(TEST_PORT, () => resolve());
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("GET /api/auth/github redirects to GitHub OAuth with client_id and valid state", async () => {
    const testWallet = "0x474d8c97445fbcf4e13c257556adbced11a9def8";
    const redirectTarget = "http://localhost:5173/onboarding";
    const res = await fetch(
      `${SERVER_URL}/api/auth/github?address=${testWallet}&redirectUrl=${encodeURIComponent(redirectTarget)}`,
      { redirect: "manual" }
    );

    expect(res.status).toBe(302);
    const location = res.headers.get("location");
    expect(location).toBeDefined();

    const url = new URL(location!);
    expect(url.hostname).toBe("github.com");
    expect(url.pathname).toBe("/login/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("Ov23liwzYmozvQE55pvk");
    expect(url.searchParams.get("scope")).toBe("read:user user:email");

    const statePayload = url.searchParams.get("state");
    expect(statePayload).toBeDefined();
    const decoded = JSON.parse(Buffer.from(statePayload!, "base64url").toString("utf-8"));
    expect(decoded.address).toBe(testWallet);
    expect(decoded.redirectUrl).toBe(redirectTarget);
  });

  it("GET /api/auth/github/callback handles denial/error and outputs HTML with postMessage", async () => {
    const statePayload = Buffer.from(
      JSON.stringify({
        address: "0x474d8c97445fbcf4e13c257556adbced11a9def8",
        redirectUrl: "http://localhost:5173/onboarding",
      })
    ).toString("base64url");

    const res = await fetch(
      `${SERVER_URL}/api/auth/github/callback?error=access_denied&error_description=The+user+has+denied+your+application&state=${statePayload}`
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Verification Notice");
    expect(html).toContain("GITHUB_AUTH_ERROR");
    expect(html).toContain("The user has denied your application");
  });

  it("POST /api/auth/github/exchange validates missing code and address", async () => {
    // Missing code
    const res1 = await fetch(`${SERVER_URL}/api/auth/github/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: "0x474d8c97445fbcf4e13c257556adbced11a9def8" }),
    });
    expect(res1.status).toBe(400);
    const body1 = await res1.json();
    expect(body1.error).toContain("Missing GitHub authorization code");

    // Missing address
    const res2 = await fetch(`${SERVER_URL}/api/auth/github/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "mock_gh_code_123" }),
    });
    expect(res2.status).toBe(400);
    const body2 = await res2.json();
    expect(body2.error).toContain("Missing Web3 wallet address");
  });

  it("GET /api/auth/github/status/:address reports verified and unverified profiles", async () => {
    const unverifiedWallet = "0x1111111111111111111111111111111111111111";
    const resUnverified = await fetch(`${SERVER_URL}/api/auth/github/status/${unverifiedWallet}`);
    const dataUnverified = await resUnverified.json();
    expect(dataUnverified.githubVerified).toBe(false);
    expect(dataUnverified.githubUsername).toBeNull();

    // Inject a verified profile into sharedState
    const verifiedWallet = "0x2222222222222222222222222222222222222222";
    const state = getSharedState();
    state.profiles = state.profiles || {};
    state.profiles[verifiedWallet] = {
      address: verifiedWallet,
      name: "Verified Dev",
      githubVerified: true,
      githubUsername: "solidity-master",
      githubId: "998877",
      attestationUID: "0xdeadbeef1234567890",
      roles: ["Freelancer"],
    } as any;

    const resVerified = await fetch(`${SERVER_URL}/api/auth/github/status/${verifiedWallet}`);
    const dataVerified = await resVerified.json();
    expect(dataVerified.githubVerified).toBe(true);
    expect(dataVerified.githubUsername).toBe("solidity-master");
    expect(dataVerified.attestationUID).toBe("0xdeadbeef1234567890");
  });

  it("Sybil Protection: detects and blocks duplicate GitHub binding across distinct wallets", async () => {
    // Setup existing verified user with githubUsername 'octocat' and githubId '583231'
    const originalWallet = "0x3333333333333333333333333333333333333333";
    const sybilWallet = "0x4444444444444444444444444444444444444444";

    const state = getSharedState();
    state.profiles = state.profiles || {};
    state.profiles[originalWallet] = {
      address: originalWallet,
      name: "Original User",
      githubVerified: true,
      githubUsername: "octocat",
      githubId: "583231",
      roles: ["Freelancer"],
    } as any;

    // Mock global fetch to return a simulated successful GitHub token and user for 'octocat'
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string | URL, init?: any) => {
      const urlStr = url.toString();
      if (urlStr.includes("login/oauth/access_token")) {
        return Promise.resolve({
          json: async () => ({ access_token: "gho_mock_access_token_123" }),
        } as any);
      }
      if (urlStr.includes("api.github.com/user")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: 583231,
            login: "octocat",
            name: "The Octocat",
            avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
            public_repos: 8,
            followers: 120,
          }),
        } as any);
      }
      return originalFetch(url, init);
    });

    try {
      // Trying to bind octocat with sybilWallet should throw DUPLICATE_GITHUB_ACCOUNT error
      let errorThrown: any = null;
      try {
        await verifyAndBindGithubOAuth("mock_code", sybilWallet);
      } catch (err: any) {
        errorThrown = err;
      }

      expect(errorThrown).toBeDefined();
      expect(errorThrown.code).toBe("DUPLICATE_GITHUB_ACCOUNT");
      expect(errorThrown.message).toContain("already registered with another wallet");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("Successful Binding: generates cryptographic attestation UID and updates profile", async () => {
    const newWallet = "0x5555555555555555555555555555555555555555";

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string | URL, init?: any) => {
      const urlStr = url.toString();
      if (urlStr.includes("login/oauth/access_token")) {
        return Promise.resolve({
          json: async () => ({ access_token: "gho_mock_token_unique" }),
        } as any);
      }
      if (urlStr.includes("api.github.com/user")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: 1234567,
            login: "unique-dev-99",
            name: "Unique Developer",
            avatar_url: "https://avatars.githubusercontent.com/u/1234567?v=4",
            public_repos: 30,
            followers: 60,
          }),
        } as any);
      }
      return originalFetch(url, init);
    });

    try {
      const result = await verifyAndBindGithubOAuth("mock_valid_code", newWallet);
      expect(result.verified).toBe(true);
      expect(result.ghUser.login).toBe("unique-dev-99");
      expect(result.attestationUID).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.reputationTier).toBe("PLATINUM");

      // Verify profile in sharedState is updated
      const state = getSharedState();
      const updatedProfile = state.profiles[newWallet];
      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.githubVerified).toBe(true);
      expect(updatedProfile.githubUsername).toBe("unique-dev-99");
      expect(updatedProfile.attestationUID).toBe(result.attestationUID);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
