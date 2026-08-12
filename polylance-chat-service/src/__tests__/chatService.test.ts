import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import EthCrypto from "eth-crypto";
import { ethers } from "ethers";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { recoverPublicKey, createConversationKey, decryptOwnKey, encryptMessage, decryptMessage } from "../crypto/ecies.js";

const registryStore = new Map<string, any>();
const messageStore: any[] = [];

vi.mock("../server.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../server.js")>();
  const mockPrisma = {
    conversationKeyRegistry: {
      upsert: async ({ where, create, update }: any) => {
        const existing = registryStore.get(where.jobAddress);
        if (existing) {
          const updated = { ...existing, ...update };
          registryStore.set(where.jobAddress, updated);
          return updated;
        }
        registryStore.set(where.jobAddress, create);
        return create;
      },
      findUnique: async ({ where }: any) => {
        return registryStore.get(where.jobAddress) || null;
      },
      update: async ({ where, data }: any) => {
        const existing = registryStore.get(where.jobAddress);
        if (!existing) throw new Error("Not found");
        const updated = { ...existing, ...data };
        registryStore.set(where.jobAddress, updated);
        return updated;
      },
      create: async ({ data }: any) => {
        registryStore.set(data.jobAddress, data);
        return data;
      },
    },
    messageIndex: {
      deleteMany: async ({ where }: any) => {
        const initialLen = messageStore.length;
        for (let i = messageStore.length - 1; i >= 0; i--) {
          if (messageStore[i].jobAddress === where.jobAddress) {
            messageStore.splice(i, 1);
          }
        }
        return { count: initialLen - messageStore.length };
      },
      findMany: async ({ where }: any) => {
        return messageStore.filter((m) => m.jobAddress === where.jobAddress);
      },
      create: async ({ data }: any) => {
        const item = { ...data, id: "msg_" + Date.now(), sentAt: new Date() };
        messageStore.push(item);
        return item;
      },
    },
  };

  return {
    ...mod,
    prisma: mockPrisma,
  };
});

const mockPrisma = {
  conversationKeyRegistry: {
    upsert: async ({ where, create, update }: any) => {
      const existing = registryStore.get(where.jobAddress);
      if (existing) {
        const updated = { ...existing, ...update };
        registryStore.set(where.jobAddress, updated);
        return updated;
      }
      registryStore.set(where.jobAddress, create);
      return create;
    },
    findUnique: async ({ where }: any) => {
      return registryStore.get(where.jobAddress) || null;
    },
    update: async ({ where, data }: any) => {
      const existing = registryStore.get(where.jobAddress);
      if (!existing) throw new Error("Not found");
      const updated = { ...existing, ...data };
      registryStore.set(where.jobAddress, updated);
      return updated;
    },
    create: async ({ data }: any) => {
      registryStore.set(data.jobAddress, data);
      return data;
    },
  },
  messageIndex: {
    deleteMany: async ({ where }: any) => {
      const initialLen = messageStore.length;
      for (let i = messageStore.length - 1; i >= 0; i--) {
        if (messageStore[i].jobAddress === where.jobAddress) {
          messageStore.splice(i, 1);
        }
      }
      return { count: initialLen - messageStore.length };
    },
    findMany: async ({ where }: any) => {
      return messageStore.filter((m) => m.jobAddress === where.jobAddress);
    },
    create: async ({ data }: any) => {
      const item = { ...data, id: "msg_" + Date.now(), sentAt: new Date() };
      messageStore.push(item);
      return item;
    },
  },
};

import { prisma, server, setPrismaInstance } from "../server.js";

const TEST_PORT = 3009;
const SERVER_URL = `http://localhost:${TEST_PORT}`;

describe("PolyLance Hardened Chat — E2E Socket Security & Crypto Invariants", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    setPrismaInstance(mockPrisma);
    await new Promise<void>((resolve) => {
      server.listen(TEST_PORT, () => resolve());
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("recovers public key from signature and executes ECIES key exchange", async () => {
    const clientIdentity = EthCrypto.createIdentity();
    const freelancerIdentity = EthCrypto.createIdentity();

    const authMsg = "PolyLance Chat Auth";
    const sig = EthCrypto.sign(clientIdentity.privateKey, EthCrypto.hash.keccak256(authMsg));
    const recoveredPub = recoverPublicKey(authMsg, sig);
    expect(recoveredPub).toEqual(clientIdentity.publicKey);

    // Create per-conversation key encrypted for both parties
    const keyExchange = await createConversationKey(clientIdentity.publicKey, freelancerIdentity.publicKey);
    expect(keyExchange.encryptedKeyForClient).not.toEqual(keyExchange.rawSymmetricKey);

    // Client decrypts their key copy
    const clientDecryptedKey = await decryptOwnKey(keyExchange.encryptedKeyForClient, clientIdentity.privateKey);
    expect(clientDecryptedKey).toEqual(keyExchange.rawSymmetricKey);

    // Freelancer decrypts their key copy
    const freelancerDecryptedKey = await decryptOwnKey(keyExchange.encryptedKeyForFreelancer, freelancerIdentity.privateKey);
    expect(freelancerDecryptedKey).toEqual(keyExchange.rawSymmetricKey);
  });

  it("encrypts message client-side with symmetric key and decrypts cleanly", () => {
    const symmetricKey = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    const plaintext = "Confidential project deliverable specifications & proof";

    const ciphertext = encryptMessage(plaintext, symmetricKey);
    expect(ciphertext).not.toEqual(plaintext);

    const decrypted = decryptMessage(ciphertext, symmetricKey);
    expect(decrypted).toEqual(plaintext);
  });

  it("crypto-shredding: key destruction permanently disables decryption and purges index", async () => {
    const jobAddress = "0x9999888877776666555544443333222211110000";
    const client = "0xaaaa1111aaaa1111aaaa1111aaaa1111aaaa1111";
    const freelancer = "0xbbbb2222bbbb2222bbbb2222bbbb2222bbbb2222";

    // 1. Create registry
    const registry = await prisma.conversationKeyRegistry.upsert({
      where: { jobAddress },
      create: {
        jobAddress,
        clientAddress: client,
        freelancerAddress: freelancer,
        encryptedKeyForClient: "ENC_KEY_CLIENT",
        encryptedKeyForFreelancer: "ENC_KEY_FREELANCER",
        deletionEligible: false,
        keyShredded: false,
      },
      update: {
        clientAddress: client,
        freelancerAddress: freelancer,
        encryptedKeyForClient: "ENC_KEY_CLIENT",
        encryptedKeyForFreelancer: "ENC_KEY_FREELANCER",
        deletionEligible: false,
        keyShredded: false,
      },
    });
    expect(registry.keyShredded).toBe(false);

    // 2. Add message CID to index
    await prisma.messageIndex.create({
      data: {
        jobAddress,
        messageCid: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        senderAddress: client,
      },
    });

    // 3. Unlock deletion (payment released on-chain)
    await prisma.conversationKeyRegistry.update({
      where: { jobAddress },
      data: { deletionEligible: true },
    });

    // 4. Perform CRYPTO-SHRED
    await prisma.conversationKeyRegistry.update({
      where: { jobAddress },
      data: {
        encryptedKeyForClient: "SHREDDED",
        encryptedKeyForFreelancer: "SHREDDED",
        keyShredded: true,
      },
    });
    await prisma.messageIndex.deleteMany({ where: { jobAddress } });

    const shreddedReg = await prisma.conversationKeyRegistry.findUnique({ where: { jobAddress } });
    expect(shreddedReg?.encryptedKeyForClient).toEqual("SHREDDED");
    expect(shreddedReg?.keyShredded).toEqual(true);

    const remainingIndex = await prisma.messageIndex.findMany({ where: { jobAddress } });
    expect(remainingIndex.length).toBe(0);
  });

  it("REAL SOCKET TEST: rejects non-party intruder wallets from joining or injecting messages", async () => {
    const clientWallet = ethers.Wallet.createRandom();
    const freelancerWallet = ethers.Wallet.createRandom();
    const intruderWallet = ethers.Wallet.createRandom();

    const jobAddress = "0x8888777766665555444433332222111100009999";

    // Pre-populate key registry for job
    const clientIdentity = EthCrypto.createIdentity();
    const freelancerIdentity = EthCrypto.createIdentity();
    const keys = await createConversationKey(clientIdentity.publicKey, freelancerIdentity.publicKey);

    await prisma.conversationKeyRegistry.upsert({
      where: { jobAddress },
      create: {
        jobAddress,
        clientAddress: clientWallet.address.toLowerCase(),
        freelancerAddress: freelancerWallet.address.toLowerCase(),
        encryptedKeyForClient: keys.encryptedKeyForClient,
        encryptedKeyForFreelancer: keys.encryptedKeyForFreelancer,
        deletionEligible: false,
        keyShredded: false,
      },
      update: {
        clientAddress: clientWallet.address.toLowerCase(),
        freelancerAddress: freelancerWallet.address.toLowerCase(),
      },
    });

    // Authenticate intruder socket
    const authMessage = "Sign to connect to PolyLance Chat";
    const intruderSig = await intruderWallet.signMessage(authMessage);

    const intruderSocket: ClientSocket = ioClient(SERVER_URL, {
      auth: {
        address: intruderWallet.address,
        signature: intruderSig,
        message: authMessage,
      },
      transports: ["websocket"],
    });

    await new Promise<void>((resolve, reject) => {
      intruderSocket.on("connect", () => resolve());
      intruderSocket.on("connect_error", (err) => reject(err));
    });

    // 1. Attempt join-job-chat as intruder -> must return UNAUTHORIZED error
    const joinRes = await new Promise<any>((resolve) => {
      intruderSocket.emit("join-job-chat", {
        jobAddress,
        clientPubKey: clientIdentity.publicKey,
        freelancerPubKey: freelancerIdentity.publicKey,
      }, (res: any) => resolve(res));
    });
    expect(joinRes.error).toContain("UNAUTHORIZED");

    // 2. Attempt send-message-notify (CID injection) as intruder -> must return UNAUTHORIZED error
    const injectRes = await new Promise<any>((resolve) => {
      intruderSocket.emit("send-message-notify", { jobAddress, cid: "bafyfakecid123" }, (res: any) => resolve(res));
    });
    expect(injectRes.error).toContain("UNAUTHORIZED");

    intruderSocket.disconnect();
  });
});
