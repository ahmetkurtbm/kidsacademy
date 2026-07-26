import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, recordAttempt } from "./rate-limit";
import { createFakeSupabase } from "../test/fakeSupabase";

describe("getClientIp", () => {
  it("reads the first address from x-forwarded-for", () => {
    const request = new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to unknown when the header is missing", () => {
    const request = new Request("http://localhost");
    expect(getClientIp(request)).toBe("unknown");
  });
});

describe("checkRateLimit", () => {
  it("is not blocked when both counters are under threshold", async () => {
    const db = createFakeSupabase({ ipFailures: 2, accountFailures: 1 });
    const result = await checkRateLimit(db as unknown as SupabaseClient, "admin", "1.2.3.4", "admin");
    expect(result.blocked).toBe(false);
  });

  it("blocks once the IP threshold is reached", async () => {
    const db = createFakeSupabase({ ipFailures: 10, accountFailures: 0 });
    const result = await checkRateLimit(db as unknown as SupabaseClient, "admin", "1.2.3.4", "admin");
    expect(result.blocked).toBe(true);
  });

  it("blocks once the account threshold is reached", async () => {
    const db = createFakeSupabase({ ipFailures: 0, accountFailures: 5 });
    const result = await checkRateLimit(db as unknown as SupabaseClient, "parent", "1.2.3.4", "ayseece");
    expect(result.blocked).toBe(true);
  });
});

describe("recordAttempt", () => {
  it("inserts a row with the given outcome", async () => {
    const db = createFakeSupabase();
    await recordAttempt(db as unknown as SupabaseClient, "parent", "1.2.3.4", "ayseece", false);
    expect(db.inserts).toEqual([{ table: "login_attempts", row: { scope: "parent", ip: "1.2.3.4", account_key: "ayseece", success: false } }]);
  });
});
