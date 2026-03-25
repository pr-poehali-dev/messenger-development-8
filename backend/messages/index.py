"""
Messages API: история сообщений в чате и отправка новых.
GET  /?chat_id=...&since_id=0   — получить сообщения
POST /                          — отправить сообщение
  body: {chat_id, sender_id, text}
"""

import json
import os
import psycopg2
from datetime import timezone


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        params = event.get("queryStringParameters") or {}
        chat_id = params.get("chat_id", "")
        since_id = int(params.get("since_id", 0))

        if not chat_id:
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "chat_id is required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT m.id, m.sender_id, u.name, m.text, m.created_at
            FROM chat_messages m
            JOIN users u ON u.id = m.sender_id
            WHERE m.chat_id = %s AND m.id > %s
            ORDER BY m.id ASC
            LIMIT 100
        """, (chat_id, since_id))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        messages = [
            {
                "id": r[0],
                "sender_id": str(r[1]),
                "sender_name": r[2],
                "text": r[3],
                "created_at": r[4].astimezone(timezone.utc).isoformat(),
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"messages": messages})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        chat_id = (body.get("chat_id") or "").strip()
        sender_id = (body.get("sender_id") or "").strip()
        text = (body.get("text") or "").strip()[:2000]

        if not chat_id or not sender_id or not text:
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "chat_id, sender_id and text are required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO chat_messages (chat_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
            (chat_id, sender_id, text)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({
                    "id": row[0],
                    "chat_id": chat_id,
                    "sender_id": sender_id,
                    "text": text,
                    "created_at": row[1].astimezone(timezone.utc).isoformat(),
                })}

    return {"statusCode": 405, "headers": CORS, "body": "Method Not Allowed"}
