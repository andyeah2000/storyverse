-- ============================================
-- CREDIT BALANCE SUPPORT
-- ============================================

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS credit_balance INTEGER NOT NULL DEFAULT 0;

DROP FUNCTION IF EXISTS spend_credits(INTEGER);
CREATE OR REPLACE FUNCTION spend_credits(spend_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  remaining INTEGER;
BEGIN
  IF spend_amount <= 0 THEN
    RAISE EXCEPTION 'Spend amount must be positive';
  END IF;

  UPDATE subscriptions
    SET credit_balance = credit_balance - spend_amount,
        updated_at = NOW()
    WHERE user_id = auth.uid()
      AND credit_balance >= spend_amount
    RETURNING credit_balance INTO remaining;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  RETURN remaining;
END;
$$;

DROP FUNCTION IF EXISTS add_credits(UUID, INTEGER);
CREATE OR REPLACE FUNCTION add_credits(target_user UUID, credit_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  IF credit_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  INSERT INTO subscriptions (user_id, credit_balance)
  VALUES (target_user, credit_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET credit_balance = subscriptions.credit_balance + EXCLUDED.credit_balance,
                updated_at = NOW()
  RETURNING credit_balance INTO new_balance;

  RETURN new_balance;
END;
$$;
