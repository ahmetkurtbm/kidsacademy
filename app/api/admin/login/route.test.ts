import { beforeEach, describe, expect, it, vi } from "vitest";
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
});
