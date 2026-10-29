import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSession } from "@/lib/auth";
import { createFakeSupabase } from "../../../../test/fakeSupabase";

let adminCookie: string | undefined;
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: (name: string) => (name === "ka_admin" && adminCookie ? { value: adminCookie } : undefined) })),
}));

let fakeDb: ReturnType<typeof createFakeSupabase>;
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => fakeDb,
}));

const staff = { display_name: "Ayşe Yılmaz", role: "staff", active: true };
const owner = { display_name: "Ahmet Kurt", role: "owner", active: true };

function request(method: string, body: unknown) {
  return new Request("http://localhost/api/admin/users", { method, body: JSON.stringify(body) });
}

/** Oturum açık hesap; getAdminSession bu kaydı veritabanından okur. */
function signIn(sub: string, account: Record<string, unknown> | null) {
  adminCookie = createSession({ role: "admin", sub });
  fakeDb = createFakeSupabase({ adminUser: account });
}

beforeEach(() => {
  vi.resetModules();
  process.env.SESSION_SECRET = "a".repeat(32);
  adminCookie = createSession({ role: "admin", sub: "recovery" });
  fakeDb = createFakeSupabase();
});

describe("POST /api/admin/users", () => {
  it("lets the recovery login create the first owner with a hashed password", async () => {
    const { POST } = await import("./route");
    const response = await POST(request("POST", { username: "Ahmet.Kurt", displayName: "Ahmet Kurt", password: "uzun-sifre-1", role: "owner" }));
    expect(response.status).toBe(200);
    const row = fakeDb.inserts[0].row;
    expect(row).toMatchObject({ username: "ahmet.kurt", display_name: "Ahmet Kurt", role: "owner" });
    expect(String(row.password_hash)).toMatch(/^scrypt\$/);
    expect(JSON.stringify(row)).not.toContain("uzun-sifre-1");
  });

  it("rejects short passwords and invalid usernames", async () => {
    const { POST } = await import("./route");
    expect((await POST(request("POST", { username: "ayse", displayName: "Ayşe", password: "kisa" }))).status).toBe(400);
    expect((await POST(request("POST", { username: "a b", displayName: "Ayşe", password: "uzun-sifre-1" }))).status).toBe(400);
  });

  it("does not let staff create accounts", async () => {
    signIn("u2", staff);
    const { POST } = await import("./route");
    expect((await POST(request("POST", { username: "yeni", displayName: "Yeni", password: "uzun-sifre-1" }))).status).toBe(403);
  });
});

describe("session checks", () => {
  it("locks out a deactivated account that still has a valid cookie", async () => {
    signIn("u2", { ...staff, active: false });
    const { GET } = await import("./route");
    expect((await GET()).status).toBe(401);
  });

  it("rejects requests without a session", async () => {
    adminCookie = undefined;
    const { GET } = await import("./route");
    expect((await GET()).status).toBe(401);
  });
});

describe("PATCH /api/admin/users", () => {
  it("does not let staff change someone else's password", async () => {
    signIn("u2", staff);
    const { PATCH } = await import("./route");
    expect((await PATCH(request("PATCH", { id: "u3", password: "uzun-sifre-1" }))).status).toBe(403);
  });

  it("asks staff for their current password before changing it", async () => {
    signIn("u2", { ...staff, password_hash: "scrypt$00$00" });
    const { PATCH } = await import("./route");
    expect((await PATCH(request("PATCH", { id: "u2", currentPassword: "yanlis", password: "uzun-sifre-1" }))).status).toBe(401);
    expect(fakeDb.updates).toHaveLength(0);
  });

  it("does not let an owner deactivate themselves", async () => {
    signIn("u1", owner);
    const { PATCH } = await import("./route");
    expect((await PATCH(request("PATCH", { id: "u1", active: false }))).status).toBe(400);
  });

  it("keeps at least one active owner", async () => {
    signIn("u1", owner);
    const { DELETE } = await import("./route");
    expect((await DELETE(request("DELETE", { id: "u9" }))).status).toBe(400);
    expect(fakeDb.deletes).toHaveLength(0);
  });
});
