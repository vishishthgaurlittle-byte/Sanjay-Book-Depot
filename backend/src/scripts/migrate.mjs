/**
 * Turso migration runner.
 *
 *   npm run migrate          apply pending migrations (idempotent)
 *   npm run migrate:reset    drop everything, then re-apply (destructive)
 *
 * Each migration is recorded in schema_migrations and applied inside a single
 * write transaction, so a failure leaves no half-created schema.
 */
import { all, assertForeignKeysEnabled, db, get, tx } from '../lib/db.mjs';
import { CORE_TABLES, MIGRATIONS } from '../lib/schema.mjs';

const RESET = process.argv.includes('--reset');

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
const fail = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);

async function main() {
  console.log('\nSanjay Book Depot - Turso migration');
  console.log(`Database: ${process.env.TURSO_URL}`);

  await assertForeignKeysEnabled();
  ok('foreign key enforcement confirmed ON');

  if (RESET) {
    console.log('\n--reset: dropping all tables, triggers and views');
    const { rows } = await db.execute(
      "SELECT type, name, tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'",
    );
    // Drop children before parents so FK constraints cannot block the teardown.
    const order = ['trigger', 'view', 'table'];
    for (const type of order) {
      for (const o of rows.filter((r) => r.type === type).reverse()) {
        try {
          await db.execute(`DROP ${type.toUpperCase()} IF EXISTS "${o.name}"`);
          ok(`dropped ${type} ${o.name}`);
        } catch (e) {
          warn(`could not drop ${o.name}: ${e.message.split('\n')[0]}`);
        }
      }
    }
  }

  // schema_migrations may not exist yet on a fresh database.
  await db.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const applied = new Set((await all('SELECT id FROM schema_migrations')).map((r) => Number(r.id)));

  console.log('\nApplying migrations');
  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) {
      warn(`#${m.id} ${m.name} - already applied, skipping`);
      continue;
    }
    try {
      await tx([
        ...m.statements.map((sql) => ({ sql, args: [] })),
        { sql: 'INSERT INTO schema_migrations (id, name) VALUES (?, ?)', args: [m.id, m.name] },
      ]);
      ok(`#${m.id} ${m.name} (${m.statements.length} statements)`);
    } catch (e) {
      fail(`#${m.id} ${m.name}: ${e.message.split('\n')[0]}`);
      throw e;
    }
  }

  /* ---- verify against sqlite_master, not against assumptions ---------- */
  console.log('\nVerifying');
  const present = new Set(
    (await all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")).map(
      (r) => r.name,
    ),
  );

  const missing = CORE_TABLES.filter((t) => !present.has(t));
  if (missing.length) {
    fail(`MISSING TABLES: ${missing.join(', ')}`);
    process.exit(1);
  }
  ok(`all ${CORE_TABLES.length} core tables present`);

  const fkCount = Number((await get('SELECT COUNT(*) AS n FROM pragma_foreign_key_list')).n);
  const totalFks = (
    await Promise.all(
      CORE_TABLES.map(async (t) => (await get(`SELECT COUNT(*) AS n FROM pragma_foreign_key_list(?)`, [t])).n),
    )
  ).reduce((a, b) => a + b, 0);
  ok(`${totalFks} foreign key constraints declared across core tables (pragma count: ${fkCount})`);

  const triggers = (await all("SELECT name FROM sqlite_master WHERE type='trigger'")).map((r) => r.name);
  ok(`${triggers.length} triggers installed`);

  const idx = (await all("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")).length;
  ok(`${idx} custom indexes installed`);

  ok(`FTS5 search table present: ${present.has('products_fts')}`);

  console.log('\n──────────────────────────────────────────');
  console.log(`Tables : ${present.size} (12 core + ${present.size - 12} support)`);
  console.log('──────────────────────────────────────────\n');
}

main().catch((e) => {
  console.error('\nMigration failed:', e.message);
  process.exit(1);
});
