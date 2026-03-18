"""
Чат API: получение истории сообщений и отправка новых.
Используется для real-time общения между пользователями.
"""

import json
import os
import psycopg2
from datetime import datetime, timezone


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        since_id = event.get("queryStringParameters", {}) or {}
        since_id = int(since_id.get("since_id", 0))

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, sender_name, text, created_at FROM messages WHERE id > %s ORDER BY id ASC LIMIT 100",
            (since_id,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        messages = [
            {
                "id": r[0],
                "sender_name": r[1],
                "text": r[2],
                "created_at": r[3].astimezone(timezone.utc).isoformat(),
            }
            for r in rows
        ]
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"messages": messages}),
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        sender_name = (body.get("sender_name") or "").strip()[:50]
        text = (body.get("text") or "").strip()[:2000]

        if not sender_name or not text:
            return {
                "statusCode": 400,
                "headers": {**cors, "Content-Type": "application/json"},
                "body": json.dumps({"error": "sender_name and text are required"}),
            }

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO messages (sender_name, text) VALUES (%s, %s) RETURNING id, created_at",
            (sender_name, text),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({
                "id": row[0],
                "sender_name": sender_name,
                "text": text,
                "created_at": row[1].astimezone(timezone.utc).isoformat(),
            }),
        }

    return {"statusCode": 405, "headers": cors, "body": "Method Not Allowed"}
