CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_created_at ON messages(created_at);
