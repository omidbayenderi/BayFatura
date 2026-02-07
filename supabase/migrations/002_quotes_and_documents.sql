-- Migration: Add Quotes and Invoice Customization
-- Description: Extends the invoice system with quotes/proforma and customization options

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quote_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  customer_tax_id TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 19,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  valid_until DATE,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, converted
  invoice_id UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_quote_number UNIQUE (user_id, quote_number)
);

-- Invoice customization settings
CREATE TABLE IF NOT EXISTS invoice_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  primary_color TEXT DEFAULT '#8B5CF6',
  accent_color TEXT DEFAULT '#6366F1',
  signature_url TEXT,
  footer_text TEXT,
  quote_validity_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment reminders configuration
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invoice_id UUID,
  reminder_type TEXT NOT NULL, -- before_due, on_due, after_due
  days_offset INTEGER NOT NULL,
  scheduled_date DATE,
  sent_at TIMESTAMP,
  email_sent BOOLEAN DEFAULT FALSE,
  email_to TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_user_id ON payment_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_scheduled_date ON payment_reminders(scheduled_date);

-- Row Level Security (RLS) policies
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- Quotes policies
CREATE POLICY "Users can view their own quotes"
  ON quotes FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can create their own quotes"
  ON quotes FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update their own quotes"
  ON quotes FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can delete their own quotes"
  ON quotes FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Invoice customization policies
CREATE POLICY "Users can view their own customization"
  ON invoice_customization FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can create their own customization"
  ON invoice_customization FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update their own customization"
  ON invoice_customization FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Payment reminders policies
CREATE POLICY "Users can view their own reminders"
  ON payment_reminders FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can create their own reminders"
  ON payment_reminders FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update their own reminders"
  ON payment_reminders FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can delete their own reminders"
  ON payment_reminders FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::UUID);
