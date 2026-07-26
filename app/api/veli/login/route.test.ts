import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "@/lib/auth";
import { createFakeSupabase } from "../../../../test/fakeSupabase";

const setCookie = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: setCookie, get: vi.fn() })),
}));

let fakeDb: ReturnType<typeof createFakeSupabase>;
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => fakeDb,
}));

async function importRoute() {
  return import("./route");
}

const passwordHash = hashPassword("veli-sifresi");

beforeEach(() => {
  vi.resetModules();
  setCookie.mockClear();
  process.env.SESSION_SECRET = "a".repeat(32);
  fakeDb = createFakeSupabase({
    ipFailures: 0,
    accountFailures: 0,
    parentAccount: { id: "parent-1", slug: "ayseece", password_hash: passwordHash, active: true },
  });
});

describe("POST /api/veli/login", () => {
  it("accepts a correct slug and password", async () => {
    const { POST } = await importRoute();
    const response = await POST(new Request("http://localhost/api/veli/login", { method: "POST", body: JSON.stringify({ slug: "ayseece", password: "veli-sifresi" }) }));
    expect(response.status).toBe(200);
    expect(setCookie).toHaveBeenCalledWith("ka_parent", expect.any(String), expect.objectContaining({ httpOnly: true }));
  });

  it("rejects an incorrect password", async () => {
    const { POST } = await importRoute();
    const response = await POST(new Request("http://localhost/api/veli/login", { method: "POST", body: JSON.stringify({ slug: "ayseece", password: "wrong" }) }));
    expect(response.status).toBe(401);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("rejects a deactivated account even with the right password", async () => {
    fakeDb = createFakeSupabase({ ipFailures: 0, accountFailures: 0, parentAccount: { id: "parent-1", slug: "ayseece", password_hash: passwordHash, active: false } });
    const { POST } = await importRoute();
    const response = await POST(new Request("http://localhost/api/veli/login", { method: "POST", body: JSON.stringify({ slug: "ayseece", password: "veli-sifresi" }) }));
    expect(response.status).toBe(401);
  });

  it("rejects a nonexistent slug without crashing", async () => {
    fakeDb = createFakeSupabase({ ipFailures: 0, accountFailures: 0, parentAccount: null });
    const { POST } = await importRoute();
    const response = await POST(new Request("http://localhost/api/veli/login", { method: "POST", body: JSON.stringify({ slug: "nobody", password: "anything" }) }));
    expect(response.status).toBe(401);
  });

  it("returns 429 when the account is rate-limited", async () => {
    fakeDb = createFakeSupabase({ ipFailures: 0, accountFailures: 5, parentAccount: { id: "parent-1", slug: "ayseece", password_hash: passwordHash, active: true } });
    const { POST } = await importRoute();
    const response = await POST(new Request("http://localhost/api/veli/login", { method: "POST", body: JSON.stringify({ slug: "ayseece", password: "veli-sifresi" }) }));
    expect(response.status).toBe(429);
  });
});
