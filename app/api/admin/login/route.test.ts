import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword, readSession } from "@/lib/auth";
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

beforeEach(() => {
  vi.resetModules();
  setCookie.mockClear();
  process.env.SESSION_SECRET = "a".repeat(32);
  process.env.ADMIN_PASSWORD = "correct-password";
  fakeDb = createFakeSupabase({ ipFailures: 0, accountFailures: 0 });
});

describe("POST /api/admin/login", () => {
  it("rejects an incorrect password", async () => {
    const { POST } = await importRoute();
    const response = await POST(new Request("http://localhost/api/admin/login", { method: "POST", body: JSON.stringify({ password: "wrong" }) }));
    expect(response.status).toBe(401);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("accepts the correct password and sets a session cookie", async () => {
    const { POST } = await importRoute();
    const response = await POST(new Request("http://localhost/api/admin/login", { method: "POST", body: JSON.stringify({ password: "correct-password" }) }));
    expect(response.status).toBe(200);
    expect(setCookie).toHaveBeenCalledWith("ka_admin", expect.any(String), expect.objectContaining({ httpOnly: true }));
  });

  it("returns 503 when ADMIN_PASSWORD is not configured", async () => {
    delete process.env.ADMIN_PASSWORD;
    const { POST } = await importRoute();
    const response = await POST(new Request("http://localhost/api/admin/login", { method: "POST", body: JSON.stringify({ password: "anything" }) }));
    expect(response.status).toBe(503);
  });

  it("returns 429 when the IP is rate-limited", async () => {
    fakeDb = createFakeSupabase({ ipFailures: 10, accountFailures: 0 });
    const { POST } = await importRoute();
    const response = await POST(new Request("http://localhost/api/admin/login", { method: "POST", body: JSON.stringify({ password: "correct-password" }) }));
    expect(response.status).toBe(429);
  });

  it("records failures per account so one user cannot lock out another", async () => {
    const { POST } = await importRoute();
    await POST(login({ username: "Ayse", password: "wrong" }));
    expect(fakeDb.inserts.find((i) => i.table === "login_attempts")?.row).toMatchObject({ account_key: "user:ayse", success: false });
  });
});

function login(body: Record<string, string>) {
  return new Request("http://localhost/api/admin/login", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/admin/login with a personal account", () => {
  const user = (overrides: Record<string, unknown> = {}) => ({ id: "u1", password_hash: hashPassword("staff-password"), active: true, ...overrides });

  it("signs the user in and puts their id in the session", async () => {
    fakeDb = createFakeSupabase({ adminUser: user() });
    const { POST } = await importRoute();
    const response = await POST(login({ username: "ayse", password: "staff-password" }));
    expect(response.status).toBe(200);
    const token = setCookie.mock.calls[0][1] as string;
    expect(readSession(token)).toMatchObject({ role: "admin", sub: "u1" });
    expect(fakeDb.updates[0]).toMatchObject({ table: "admin_users", filters: { id: "u1" } });
  });

  it("rejects a wrong password", async () => {
    fakeDb = createFakeSupabase({ adminUser: user() });
    const { POST } = await importRoute();
    expect((await POST(login({ username: "ayse", password: "nope" }))).status).toBe(401);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("rejects a deactivated account even with the right password", async () => {
    fakeDb = createFakeSupabase({ adminUser: user({ active: false }) });
    const { POST } = await importRoute();
    expect((await POST(login({ username: "ayse", password: "staff-password" }))).status).toBe(401);
  });

  it("rejects an unknown username", async () => {
    fakeDb = createFakeSupabase({ adminUser: null });
    const { POST } = await importRoute();
    expect((await POST(login({ username: "nobody", password: "staff-password" }))).status).toBe(401);
  });

  it("does not accept the recovery password as a personal account password", async () => {
    fakeDb = createFakeSupabase({ adminUser: user() });
    const { POST } = await importRoute();
    expect((await POST(login({ username: "ayse", password: "correct-password" }))).status).toBe(401);
  });
});
