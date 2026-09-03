/**
 * Sanjay Book Depot - Turso (SQLite/libSQL) schema.
 *
 * 12 core tables. Design notes specific to SQLite, all verified against the
 * live database:
 *
 *   - Foreign keys ARE enforced (Turso sets PRAGMA foreign_keys=ON); an orphan
 *     insert raises SQLITE_CONSTRAINT. This is the opposite of Insforge, where
 *     FKs passed at table creation are silently discarded.
 *   - `discount_percent` is a GENERATED STORED column, so it can never drift
 *     out of sync with mrp/selling_price.
 *   - No native uuid/boolean/numeric types: TEXT for ids, INTEGER 0/1 for
 *     booleans, REAL for money.
 *   - JSON is TEXT, queried with the JSON1 extension (json_extract).
 *   - Datetimes are ISO-8601 TEXT via datetime('now'), which is UTC.
 *
 * `customers.auth_user_id` deliberately has NO foreign key: the user record
 * lives in Insforge's Postgres (auth.users), a different database. Integrity
 * for that column is enforced in application code.
 *
 * Money is REAL (rupees). IEEE-754 doubles cannot represent every decimal
 * exactly, so cart totals must be rounded at the point of calculation.
 */

const now = "DEFAULT (datetime('now'))";

export const MIGRATIONS = [
  {
    id: 1,
    name: 'core tables',
    statements: [
      /* bookkeeping ------------------------------------------------------ */
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         id INTEGER PRIMARY KEY,
         name TEXT NOT NULL,
         applied_at TEXT NOT NULL ${now}
       )`,

      /* 1. brands -------------------------------------------------------- */
      `CREATE TABLE IF NOT EXISTS brands (
         id TEXT PRIMARY KEY,
         slug TEXT NOT NULL UNIQUE,
         name TEXT NOT NULL,
         tier TEXT NOT NULL DEFAULT 'tier1' CHECK (tier IN ('tier1','tier2','tier3')),
         tagline TEXT,
         description TEXT,
         logo_url TEXT,
         website TEXT,
         parent_company TEXT,
         is_featured INTEGER NOT NULL DEFAULT 0,
         is_active INTEGER NOT NULL DEFAULT 1,
         sort_order INTEGER NOT NULL DEFAULT 0,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,

      /* 2. categories ---------------------------------------------------- */
      `CREATE TABLE IF NOT EXISTS categories (
         id TEXT PRIMARY KEY,
         slug TEXT NOT NULL UNIQUE,
         name TEXT NOT NULL,
         parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
         depth INTEGER NOT NULL DEFAULT 1 CHECK (depth IN (1,2)),
         description TEXT,
         icon TEXT,
         image_url TEXT,
         is_featured INTEGER NOT NULL DEFAULT 0,
         is_active INTEGER NOT NULL DEFAULT 1,
         sort_order INTEGER NOT NULL DEFAULT 0,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,

      /* 3. products ------------------------------------------------------ */
      `CREATE TABLE IF NOT EXISTS products (
         id TEXT PRIMARY KEY,
         sku TEXT NOT NULL UNIQUE,
         name TEXT NOT NULL,
         slug TEXT NOT NULL UNIQUE,
         brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
         category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
         short_description TEXT,
         description TEXT,
         mrp REAL NOT NULL CHECK (mrp > 0),
         selling_price REAL NOT NULL CHECK (selling_price >= 0),
         discount_percent INTEGER GENERATED ALWAYS AS (
           CASE WHEN mrp > 0
             THEN CAST(ROUND((mrp - selling_price) * 100.0 / mrp) AS INTEGER)
             ELSE 0 END
         ) STORED,
         stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
         low_stock_threshold INTEGER NOT NULL DEFAULT 10,
         specifications TEXT,
         tags TEXT,
         seo TEXT,
         model_3d_url TEXT,
         rating_average REAL NOT NULL DEFAULT 0 CHECK (rating_average >= 0 AND rating_average <= 5),
         rating_count INTEGER NOT NULL DEFAULT 0,
         units_sold INTEGER NOT NULL DEFAULT 0,
         is_featured INTEGER NOT NULL DEFAULT 0,
         is_bestseller INTEGER NOT NULL DEFAULT 0,
         is_active INTEGER NOT NULL DEFAULT 1,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now},
         CHECK (selling_price <= mrp)
       )`,

      /* 4. product_images ------------------------------------------------ */
      `CREATE TABLE IF NOT EXISTS product_images (
         id TEXT PRIMARY KEY,
         product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
         image_url TEXT NOT NULL,
         alt_text TEXT,
         position INTEGER NOT NULL DEFAULT 0,
         is_primary INTEGER NOT NULL DEFAULT 0,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,

      /* 5. product_variants ---------------------------------------------- */
      `CREATE TABLE IF NOT EXISTS product_variants (
         id TEXT PRIMARY KEY,
         product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
         sku TEXT NOT NULL UNIQUE,
         variant_type TEXT NOT NULL CHECK (variant_type IN ('colour','size','pack')),
         option_value TEXT NOT NULL,
         price_delta REAL NOT NULL DEFAULT 0,
         stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
         hex_code TEXT,
         is_active INTEGER NOT NULL DEFAULT 1,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,

      /* 6. customers ----------------------------------------------------- */
      `CREATE TABLE IF NOT EXISTS customers (
         id TEXT PRIMARY KEY,
         auth_user_id TEXT NOT NULL UNIQUE,  -- Insforge auth.users.id; NOT an FK (different DB)
         full_name TEXT,
         email TEXT NOT NULL UNIQUE,
         phone TEXT,
         avatar_url TEXT,
         is_newsletter_subscribed INTEGER NOT NULL DEFAULT 0,
         marketing_consent INTEGER NOT NULL DEFAULT 0,
         loyalty_points INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,

      /* 7. customer_addresses -------------------------------------------- */
      `CREATE TABLE IF NOT EXISTS customer_addresses (
         id TEXT PRIMARY KEY,
         customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
         label TEXT NOT NULL DEFAULT 'Home',
         full_name TEXT NOT NULL,
         phone TEXT NOT NULL,
         line1 TEXT NOT NULL,
         line2 TEXT,
         city TEXT NOT NULL,
         state TEXT NOT NULL,
         pincode TEXT NOT NULL,
         country TEXT NOT NULL DEFAULT 'India',
         is_default_shipping INTEGER NOT NULL DEFAULT 0,
         is_default_billing INTEGER NOT NULL DEFAULT 0,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,

      /* 8. orders -------------------------------------------------------- */
      `CREATE TABLE IF NOT EXISTS orders (
         id TEXT PRIMARY KEY,
         order_number TEXT NOT NULL UNIQUE,
         customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
         status TEXT NOT NULL DEFAULT 'pending'
           CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','returned')),
         payment_status TEXT NOT NULL DEFAULT 'unpaid'
           CHECK (payment_status IN ('unpaid','paid','refunded','failed')),
         payment_method TEXT CHECK (payment_method IN ('cod','upi','card','netbanking')),
         payment_reference TEXT,
         subtotal REAL NOT NULL DEFAULT 0,
         discount_amount REAL NOT NULL DEFAULT 0,
         shipping_fee REAL NOT NULL DEFAULT 0,
         tax_amount REAL NOT NULL DEFAULT 0,
         total REAL NOT NULL DEFAULT 0,
         coupon_code TEXT,
         shipping_address TEXT,
         billing_address TEXT,
         tracking_id TEXT,
         notes TEXT,
         placed_at TEXT NOT NULL ${now},
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,

      /* 9. order_items --------------------------------------------------- */
      `CREATE TABLE IF NOT EXISTS order_items (
         id TEXT PRIMARY KEY,
         order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
         product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
         sku TEXT NOT NULL,
         product_name TEXT NOT NULL,
         brand_name TEXT,
         image_url TEXT,
         variant_info TEXT,
         quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
         unit_price REAL NOT NULL CHECK (unit_price >= 0),
         total_price REAL NOT NULL CHECK (total_price >= 0),
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,

      /* 10. admin_users -------------------------------------------------- */
      `CREATE TABLE IF NOT EXISTS admin_users (
         id TEXT PRIMARY KEY,
         email TEXT NOT NULL UNIQUE,
         full_name TEXT NOT NULL,
         role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','admin','staff')),
         avatar_url TEXT,
         last_login_at TEXT,
         is_active INTEGER NOT NULL DEFAULT 1,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,

      /* 11. product_reviews ---------------------------------------------- */
      `CREATE TABLE IF NOT EXISTS product_reviews (
         id TEXT PRIMARY KEY,
         product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
         customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
         author_name TEXT,
         rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
         title TEXT,
         body TEXT,
         is_approved INTEGER NOT NULL DEFAULT 1,
         is_verified_purchase INTEGER NOT NULL DEFAULT 0,
         helpful_count INTEGER NOT NULL DEFAULT 0,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,

      /* 12. coupons ------------------------------------------------------ */
      `CREATE TABLE IF NOT EXISTS coupons (
         id TEXT PRIMARY KEY,
         code TEXT NOT NULL UNIQUE,
         description TEXT,
         discount_type TEXT NOT NULL DEFAULT 'percent'
           CHECK (discount_type IN ('percent','flat','shipping')),
         discount_value REAL NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
         min_order_value REAL NOT NULL DEFAULT 0,
         max_discount REAL,
         usage_limit INTEGER,
         used_count INTEGER NOT NULL DEFAULT 0,
         per_user_limit INTEGER NOT NULL DEFAULT 1,
         starts_at TEXT,
         expires_at TEXT,
         applies_to TEXT,
         is_active INTEGER NOT NULL DEFAULT 1,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,
    ],
  },

  {
    id: 2,
    name: 'indexes',
    statements: [
      'CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured)',
      'CREATE INDEX IF NOT EXISTS idx_products_active_price ON products(is_active, selling_price)',
      'CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(stock_quantity) WHERE stock_quantity <= low_stock_threshold',
      'CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id, position)',
      'CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_addresses_customer ON customer_addresses(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, placed_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, placed_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id, is_approved)',
      'CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(code) WHERE is_active = 1',
    ],
  },

  {
    id: 3,
    name: 'updated_at triggers',
    // recursive_triggers is off by default, so this does not loop.
    statements: [
      'brands',
      'categories',
      'products',
      'product_images',
      'product_variants',
      'customers',
      'customer_addresses',
      'orders',
      'order_items',
      'admin_users',
      'product_reviews',
      'coupons',
    ].map(
      (t) => `CREATE TRIGGER IF NOT EXISTS trg_${t}_updated_at
        AFTER UPDATE ON ${t} FOR EACH ROW
        BEGIN
          UPDATE ${t} SET updated_at = datetime('now') WHERE id = NEW.id;
        END`,
    ),
  },

  {
    id: 4,
    name: 'product search (FTS5)',
    statements: [
      `CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
         name, brand, category, short_description, tags,
         content='products', content_rowid='rowid'
       )`,
      `CREATE TRIGGER IF NOT EXISTS products_fts_ai AFTER INSERT ON products BEGIN
         INSERT INTO products_fts(rowid, name, brand, category, short_description, tags)
         VALUES (NEW.rowid, NEW.name,
                 (SELECT name FROM brands WHERE id = NEW.brand_id),
                 (SELECT name FROM categories WHERE id = NEW.category_id),
                 NEW.short_description, NEW.tags);
       END`,
      `CREATE TRIGGER IF NOT EXISTS products_fts_ad AFTER DELETE ON products BEGIN
         INSERT INTO products_fts(products_fts, rowid, name, brand, category, short_description, tags)
         VALUES ('delete', OLD.rowid, OLD.name,
                 (SELECT name FROM brands WHERE id = OLD.brand_id),
                 (SELECT name FROM categories WHERE id = OLD.category_id),
                 OLD.short_description, OLD.tags);
       END`,
      `CREATE TRIGGER IF NOT EXISTS products_fts_au AFTER UPDATE ON products BEGIN
         INSERT INTO products_fts(products_fts, rowid, name, brand, category, short_description, tags)
         VALUES ('delete', OLD.rowid, OLD.name,
                 (SELECT name FROM brands WHERE id = OLD.brand_id),
                 (SELECT name FROM categories WHERE id = OLD.category_id),
                 OLD.short_description, OLD.tags);
         INSERT INTO products_fts(rowid, name, brand, category, short_description, tags)
         VALUES (NEW.rowid, NEW.name,
                 (SELECT name FROM brands WHERE id = NEW.brand_id),
                 (SELECT name FROM categories WHERE id = NEW.category_id),
                 NEW.short_description, NEW.tags);
       END`,
    ],
  },

  {
    id: 5,
    name: 'site settings',
    statements: [
      // Key/value store for admin-controlled storefront configuration.
      // Currently holds `active_theme`; theme definitions live in code
      // (frontend/src/lib/themes.ts) because they are design tokens, not data.
      `CREATE TABLE IF NOT EXISTS site_settings (
         key TEXT PRIMARY KEY,
         value TEXT NOT NULL,
         updated_by TEXT,
         updated_at TEXT NOT NULL ${now}
       )`,
    ],
  },

  {
    id: 6,
    name: 'khata ledger',
    statements: [
      // Khata book: parties (customers/suppliers) and their credit/debit entries.
      // balance = opening_balance + SUM(credit) - SUM(debit)
      //   credit = "You Gave" (a sale on credit → they owe you more)
      //   debit  = "You Got"  (a payment received → they owe you less)
      `CREATE TABLE IF NOT EXISTS khata_parties (
         id TEXT PRIMARY KEY,
         name TEXT NOT NULL,
         phone TEXT,
         email TEXT,
         address TEXT,
         notes TEXT,
         opening_balance REAL NOT NULL DEFAULT 0,
         is_active INTEGER NOT NULL DEFAULT 1,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,
      `CREATE TABLE IF NOT EXISTS khata_transactions (
         id TEXT PRIMARY KEY,
         party_id TEXT NOT NULL REFERENCES khata_parties(id) ON DELETE CASCADE,
         type TEXT NOT NULL CHECK (type IN ('credit','debit')),
         amount REAL NOT NULL CHECK (amount > 0),
         note TEXT,
         reference TEXT,
         entry_date TEXT NOT NULL,
         created_at TEXT NOT NULL ${now},
         updated_at TEXT NOT NULL ${now}
       )`,
      `CREATE INDEX IF NOT EXISTS idx_khata_tx_party
         ON khata_transactions(party_id, entry_date)`,
      `CREATE TRIGGER IF NOT EXISTS trg_khata_parties_updated_at
         AFTER UPDATE ON khata_parties FOR EACH ROW
         BEGIN UPDATE khata_parties SET updated_at = datetime('now') WHERE id = NEW.id; END`,
      `CREATE TRIGGER IF NOT EXISTS trg_khata_transactions_updated_at
         AFTER UPDATE ON khata_transactions FOR EACH ROW
         BEGIN UPDATE khata_transactions SET updated_at = datetime('now') WHERE id = NEW.id; END`,
    ],
  },
];

/** The 12 tables the plan calls for (excludes bookkeeping + FTS shadow table). */
export const CORE_TABLES = [
  'brands',
  'categories',
  'products',
  'product_images',
  'product_variants',
  'customers',
  'customer_addresses',
  'orders',
  'order_items',
  'admin_users',
  'product_reviews',
  'coupons',
];
