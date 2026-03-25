CREATE TABLE message_reactions (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES chat_messages(id),
    user_id UUID NOT NULL REFERENCES users(id),
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(message_id, user_id, emoji)
);
CREATE INDEX message_reactions_msg_idx ON message_reactions(message_id);
