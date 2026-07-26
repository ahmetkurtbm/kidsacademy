import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSession, hashPassword, readSession, verifyPassword } from "./auth";

beforeEach(() => {
  process.env.SESSION_SECRET = "a".repeat(32);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createSession / readSession", () => {
  it("round-trips the payload", () => {
    const token = createSession({ role: "admin" });
    const session = readSession(token);
    expect(session?.role).toBe("admin");
  });

  it("returns null for an undefined token", () => {
    expect(readSession(undefined)).toBeNull();
  });

  it("returns null when the signature is tampered with", () => {
    const token = createSession({ role: "admin" });
    const [payload] = token.split(".");
    expect(readSession(`${payload}.invalidsignature`)).toBeNull();
  });

  it("returns null when the payload is tampered with", () => {
    const token = createSession({ role: "admin" });
    const [, signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ role: "admin", exp: Math.floor(Date.now() / 1000) + 999 })).toString("base64url");
    expect(readSession(`${forgedPayload}.${signature}`)).toBeNull();
  });

  it("returns null for a malformed token", () => {
    expect(readSession("not-a-valid-token")).toBeNull();
  });

  it("returns null once the session has expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date());
    const token = createSession({ role: "parent" });
    vi.setSystemTime(Date.now() + 9 * 60 * 60 * 1000);
    expect(readSession(token)).toBeNull();
  });
});

describe("hashPassword / verifyPassword", () => {
  it("verifies a correct password", () => {
    const hash = hashPassword("correct-horse");
    expect(verifyPassword("correct-horse", hash)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const hash = hashPassword("correct-horse");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("salts each hash differently", () => {
    expect(hashPassword("same-password")).not.toBe(hashPassword("same-password"));
  });

  it("rejects a malformed stored hash", () => {
    expect(verifyPassword("anything", "not-a-valid-hash")).toBe(false);
  });
});
