CREATE TABLE IF NOT EXISTS brands (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, city TEXT NOT NULL,
 district TEXT DEFAULT '', description TEXT NOT NULL, services TEXT DEFAULT '',
 cover_url TEXT DEFAULT '', website TEXT DEFAULT '', instagram TEXT DEFAULT '',
 line_url TEXT DEFAULT '', phone TEXT DEFAULT '', address TEXT DEFAULT '',
 contact_name TEXT DEFAULT '', contact_email TEXT DEFAULT '',
 is_guangyuan INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','rejected')),
 consent INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category);
