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

beforeEach(() => {
  vi.resetModules();
  process.env.SESSION_SECRET = "a".repeat(32);
  fakeDb = createFakeSupabase();
  adminCookie = createSession({ role: "admin" });
});

function post(fields: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return new Request("http://localhost/api/admin/announcements", { method: "POST", body: form });
}

function patch(body: unknown) {
  return new Request("http://localhost/api/admin/announcements", { method: "PATCH", body: JSON.stringify(body) });
}

describe("POST /api/admin/announcements", () => {
  it("publishes by default", async () => {
    const { POST } = await import("./route");
    const response = await POST(post({ title: "Yaz okulu", body: "Kayıtlar başladı" }));
    expect(response.status).toBe(200);
    expect(fakeDb.inserts[0]).toMatchObject({ table: "announcements", row: { published: true } });
  });

  it("saves a draft when the draft box is ticked", async () => {
    const { POST } = await import("./route");
    const response = await POST(post({ title: "Yaz okulu", body: "Kayıtlar başladı", draft: "on" }));
    expect(response.status).toBe(200);
    expect(fakeDb.inserts[0]).toMatchObject({ table: "announcements", row: { published: false } });
  });
});

describe("PATCH /api/admin/announcements", () => {
  it("rejects requests without an admin session", async () => {
    adminCookie = undefined;
    const { PATCH } = await import("./route");
    const response = await PATCH(patch({ id: "a1", published: false }));
    expect(response.status).toBe(401);
    expect(fakeDb.updates).toHaveLength(0);
  });

  it("changes the publish state", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(patch({ id: "a1", published: false }));
    expect(response.status).toBe(200);
    expect(fakeDb.updates[0]).toMatchObject({ table: "announcements", row: { published: false }, filters: { id: "a1" } });
  });

  it("rejects a non-boolean publish state", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(patch({ id: "a1", published: "yes" }));
    expect(response.status).toBe(400);
  });
});
