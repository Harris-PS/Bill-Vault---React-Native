-- ============================================================
-- BillVault — Complete Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor (project > SQL Editor > New Query)
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search

-- ── Tables ────────────────────────────────────────────────────

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  address       TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL,
  phone_number  TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- expense_categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  color         TEXT,
  icon          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- bills
CREATE TABLE IF NOT EXISTS bills (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_name        TEXT NOT NULL DEFAULT '',
  store_address     TEXT,
  gst_number        TEXT,
  invoice_number    TEXT,
  payment_method    TEXT NOT NULL DEFAULT 'Other',
  payment_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_time      TIME NOT NULL DEFAULT CURRENT_TIME,
  currency          TEXT NOT NULL DEFAULT 'INR',
  subtotal          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  receipt_image_url TEXT,
  qr_raw_data       TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- bill_items
CREATE TABLE IF NOT EXISTS bill_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id          UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  item_name        TEXT NOT NULL DEFAULT '',
  item_quantity    NUMERIC(10, 3) NOT NULL DEFAULT 1,
  item_price       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  item_total       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  product_category TEXT NOT NULL DEFAULT 'Other',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  dark_mode             BOOLEAN NOT NULL DEFAULT FALSE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  default_currency      TEXT NOT NULL DEFAULT 'INR',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────

-- bills: fast lookup by user and date
CREATE INDEX IF NOT EXISTS idx_bills_user_id    ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_date       ON bills(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_bills_user_date  ON bills(user_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_bills_method     ON bills(payment_method);
CREATE INDEX IF NOT EXISTS idx_bills_amount     ON bills(total_amount);

-- Full-text search on store name
CREATE INDEX IF NOT EXISTS idx_bills_store_trgm ON bills USING gin(store_name gin_trgm_ops);

-- bill_items
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id   ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_name_trgm ON bill_items USING gin(item_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_bill_items_category  ON bill_items(product_category);

-- expense_categories
CREATE INDEX IF NOT EXISTS idx_categories_user ON expense_categories(user_id);

-- ── Auto-update updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Auto-create profile on signup ──────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, address, phone_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Row Level Security (RLS) ───────────────────────────────────

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences  ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- bills policies
CREATE POLICY "Users can view own bills"
  ON bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills"
  ON bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
  ON bills FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills"
  ON bills FOR DELETE
  USING (auth.uid() = user_id);

-- bill_items policies (access through bill ownership)
CREATE POLICY "Users can view own bill items"
  ON bill_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bills
      WHERE bills.id = bill_items.bill_id
        AND bills.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bill items for own bills"
  ON bill_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bills
      WHERE bills.id = bill_items.bill_id
        AND bills.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own bill items"
  ON bill_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bills
      WHERE bills.id = bill_items.bill_id
        AND bills.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own bill items"
  ON bill_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bills
      WHERE bills.id = bill_items.bill_id
        AND bills.user_id = auth.uid()
    )
  );

-- expense_categories policies
CREATE POLICY "Users can manage own categories"
  ON expense_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_preferences policies
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Storage Bucket ─────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New Bucket → name: "receipts", Public: false
-- Then add these policies in Storage → Policies:

-- Storage RLS (run via Supabase dashboard or API):
-- INSERT: bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
-- SELECT: bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
-- DELETE: bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]

-- ── Sample seed data (optional, for testing) ───────────────────
-- Uncomment and run after signing up your first user:
/*
INSERT INTO expense_categories (user_id, category_name, color, icon) VALUES
  ('<YOUR_USER_UUID>', 'Groceries', '#059669', 'cart-outline'),
  ('<YOUR_USER_UUID>', 'Food & Dining', '#DC2626', 'food-outline'),
  ('<YOUR_USER_UUID>', 'Transport', '#2563EB', 'car-outline'),
  ('<YOUR_USER_UUID>', 'Healthcare', '#7C3AED', 'medical-bag'),
  ('<YOUR_USER_UUID>', 'Electronics', '#D97706', 'laptop'),
  ('<YOUR_USER_UUID>', 'Other', '#6B7280', 'tag-outline');
*/
