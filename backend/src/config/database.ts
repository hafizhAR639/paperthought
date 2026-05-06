import pkg from "pg";
import { config } from "./index";
const { Pool } = pkg;

export let pool: any;

if (process.env.NODE_ENV === "test") {
  // In-memory test pool: simple SQL-ish handler for tests (INSERT/SELECT/UPDATE)
  const store: Record<string, any[]> = {
    users: [],
    papers: [],
    paper_versions: [],
    paragraphs: [],
    analysis_results: [],
  };

  function resetStore() {
    store.users = [];
    store.papers = [];
    store.paper_versions = [];
    store.paragraphs = [];
    store.analysis_results = [];
  }

  const mockPool = {
    _store: store,
    _setup: async () => resetStore(),
    _clear: async () => resetStore(),
    query: async (text: string, params: any[] = []) => {
      const sql = String(text).trim();

      // INSERT handling (very small subset used by tests)
      const insertMatch = sql.match(
        /INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
      );
      if (insertMatch) {
        const table = insertMatch[1];
        const cols = insertMatch[2].split(",").map((c) => c.trim());

        // Build row from params (we assume params array order matches columns)
        const row: Record<string, any> = {};
        for (let i = 0; i < cols.length; i++) {
          // normalize column name
          const col = cols[i].replace(/"/g, "").trim();
          row[col] = params[i];
        }

        // simple unique constraint: users.email
        if (table === "users") {
          const exists = store.users.find((u) => u.email === row.email);
          if (exists) {
            throw new Error(
              'duplicate key value violates unique constraint "users_email_key"',
            );
          }
        }

        // Apply PostgreSQL-style column defaults for known tables
        if (table === "paragraphs") {
          if (row.revised_text === undefined) row.revised_text = null;
          if (row.citation_score === undefined) row.citation_score = 0;
          if (row.coherence_score === undefined) row.coherence_score = 0;
          if (row.alignment_score === undefined) row.alignment_score = 0;
          if (row.research_gap_score === undefined) row.research_gap_score = 0;
        }

        store[table] = store[table] || [];
        store[table].push(row);
        return { rows: [row], rowCount: 1 };
      }

      // UPDATE handling: UPDATE <table> SET col = $1 WHERE id = $2
      const updateMatch = sql.match(
        /UPDATE\s+(\w+)\s+SET\s+(.+)\s+WHERE\s+(\w+)\s*=\s*\$\d+/i,
      );
      if (updateMatch) {
        const table = updateMatch[1];
        // very naive: assume WHERE id = $N and SET single column = $M
        // Extract where param value by taking last param
        const whereParam = params[params.length - 1];
        const setPairs = updateMatch[2].split(",").map((s) => s.trim());
        const updated: Record<string, any> = {};
        setPairs.forEach((pair, idx) => {
          const col = pair.split("=")[0].trim().replace(/"/g, "");
          // set params order: earlier params correspond to SET values
          updated[col] = params[idx];
        });

        const rows = store[table] || [];
        const row = rows.find((r) => r.id === whereParam);
        if (row) {
          Object.assign(row, updated);
          return { rows: [row], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      // SELECT handling: support WHERE <col> = $1 and ORDER BY
      const selectMatch = sql.match(
        /SELECT\s+([\s\S]+)\s+FROM\s+(\w+)(?:\s+WHERE\s+([\s\S]+))?/i,
      );
      if (selectMatch) {
        const cols = selectMatch[1].trim();
        const table = selectMatch[2];
        const whereClause = selectMatch[3];

        let rows: any[] = (store[table] || []).map((r) => ({ ...r }));

        if (whereClause) {
          // very basic handling: <col> = $1 OR <col> = $1 AND user_id = $2
          const whereParts = whereClause.split(/AND/i).map((s) => s.trim());
          whereParts.forEach((part, idx) => {
            const m = part.match(/(\w+)\s*=\s*\$(\d+)/);
            if (m) {
              const col = m[1];
              const paramIndex = parseInt(m[2], 10) - 1;
              const val = params[paramIndex];
              rows = rows.filter((r) => r[col] === val);
            }
          });
        }

        // ORDER BY support
        const orderMatch = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)/i);
        if (orderMatch) {
          const key = orderMatch[1];
          const dir = orderMatch[2].toUpperCase();
          rows.sort((a: any, b: any) => {
            if (a[key] === b[key]) return 0;
            if (a[key] == null) return 1;
            if (b[key] == null) return -1;
            return dir === "ASC"
              ? a[key] > b[key]
                ? 1
                : -1
              : a[key] > b[key]
                ? -1
                : 1;
          });
        }

        // Projection: if cols === '*' return full rows
        if (cols !== "*" && cols !== "*)") {
          const requested = cols
            .split(",")
            .map((c: string) => c.trim().split(" ")[0].replace(/"/g, ""));
          const projected = rows.map((r) => {
            const out: Record<string, any> = {};
            requested.forEach((c: string) => {
              // handle alias like full_name AS "fullName"
              // Use null (not undefined) to match PostgreSQL behaviour
              out[c] = r[c] !== undefined ? r[c] : null;
            });
            return out;
          });
          return { rows: projected, rowCount: projected.length };
        }

        return { rows, rowCount: rows.length };
      }

      // Fallback: return empty result
      return { rows: [], rowCount: 0 };
    },
    connect: async () => {
      // Return a mock client that proxies to the same pool
      return {
        query: async (text: string, params: any[] = []) =>
          (mockPool as any).query(text, params),
        release: () => undefined,
      };
    },
    end: async () => undefined,
    on: (_: string, __?: any) => undefined,
  } as unknown;

  pool = mockPool;
} else {
  pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on("error", (err: any) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
  });

  pool.on("connect", () => {
    console.log("Connected to PostgreSQL database");
  });
}

export async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connection successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

export async function closePool() {
  await pool.end();
}
