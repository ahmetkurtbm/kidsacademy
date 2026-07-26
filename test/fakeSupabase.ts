type QueryFilters = Record<string, unknown>;

export function createFakeSupabase(options: {
  ipFailures?: number;
  accountFailures?: number;
  parentAccount?: Record<string, unknown> | null;
} = {}) {
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  const updates: Array<{ table: string; row: Record<string, unknown>; filters: QueryFilters }> = [];

  const db = {
    from(table: string) {
      return {
        select(_cols: string, opts?: { count?: string; head?: boolean }) {
          const filters: QueryFilters = {};
          const query = {
            eq(field: string, value: unknown) { filters[field] = value; return query; },
            gte(field: string, value: unknown) { filters[field] = value; return query; },
            order() { return query; },
            maybeSingle() {
              if (table === "parent_accounts") return Promise.resolve({ data: options.parentAccount ?? null, error: null });
              return Promise.resolve({ data: null, error: null });
            },
            then(onFulfilled: (v: { count: number | null; error: null } | { data: unknown[]; error: null }) => unknown, onRejected?: (e: unknown) => unknown) {
              if (opts?.count) {
                const count = "ip" in filters ? (options.ipFailures ?? 0) : (options.accountFailures ?? 0);
                return Promise.resolve({ count, error: null }).then(onFulfilled, onRejected);
              }
              return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
            },
          };
          return query;
        },
        insert(row: Record<string, unknown>) {
          inserts.push({ table, row });
          return Promise.resolve({ data: null, error: null });
        },
        update(row: Record<string, unknown>) {
          const filters: QueryFilters = {};
          const builder = { eq(field: string, value: unknown) { filters[field] = value; updates.push({ table, row, filters }); return Promise.resolve({ data: null, error: null }); } };
          return builder;
        },
      };
    },
    inserts,
    updates,
  };

  return db;
}
