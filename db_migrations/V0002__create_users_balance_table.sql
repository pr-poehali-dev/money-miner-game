CREATE TABLE IF NOT EXISTS t_p86571260_money_miner_game.users (
  user_id TEXT PRIMARY KEY,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO t_p86571260_money_miner_game.users (user_id, balance)
VALUES ('player_1', 500)
ON CONFLICT DO NOTHING;
