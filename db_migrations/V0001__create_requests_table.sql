
CREATE TABLE IF NOT EXISTS t_p86571260_money_miner_game.requests (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  amount NUMERIC(12,2) NOT NULL,
  card TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  tg_message_id INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
