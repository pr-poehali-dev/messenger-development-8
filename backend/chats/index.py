"""
Chats API: список чатов пользователя, создание чата по invite-коду.
GET  /?user_id=...              — список чатов пользователя
POST /                          — создать чат по invite_code собеседника
  body: {user_id, invite_code}
GET  /?lookup_invite=<code>     — найти пользователя по invite_code
"""

import json
import os
import psycopg2


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
    params = event.get("queryStringParameters") or {}

    if method == "GET":
        lookup = params.get("lookup_invite", "")
        if lookup:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, name, invite_code FROM users WHERE invite_code = %s", (lookup,))
            row = cur.fetchone()
            cur.close()
            conn.close()
            if not row:
                return {"statusCode": 404, "headers": {**CORS, "Content-Type": "application/json"},
                        "body": json.dumps({"error": "user not found"})}
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"id": str(row[0]), "name": row[1], "invite_code": row[2]})}

        user_id = params.get("user_id", "")
        if not user_id:
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "user_id is required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id,
                   CASE WHEN c.user_a = %s THEN ub.id ELSE ua.id END AS partner_id,
                   CASE WHEN c.user_a = %s THEN ub.name ELSE ua.name END AS partner_name,
                   (SELECT text FROM chat_messages WHERE chat_id = c.id ORDER BY id DESC LIMIT 1) AS last_msg,
                   (SELECT created_at FROM chat_messages WHERE chat_id = c.id ORDER BY id DESC LIMIT 1) AS last_time
            FROM chats c
            JOIN users ua ON ua.id = c.user_a
            JOIN users ub ON ub.id = c.user_b
            WHERE c.user_a = %s OR c.user_b = %s
            ORDER BY last_time DESC NULLS LAST
        """, (user_id, user_id, user_id, user_id))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        chats = [
            {
                "id": str(r[0]),
                "partner_id": str(r[1]),
                "partner_name": r[2],
                "last_msg": r[3],
                "last_time": r[4].isoformat() if r[4] else None,
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"chats": chats})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        user_id = (body.get("user_id") or "").strip()
        invite_code = (body.get("invite_code") or "").strip()

        if not user_id or not invite_code:
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "user_id and invite_code are required"})}

        conn = get_conn()
        cur = conn.cursor()

        cur.execute("SELECT id, name FROM users WHERE invite_code = %s", (invite_code,))
        partner = cur.fetchone()
        if not partner:
            cur.close()
            conn.close()
            return {"statusCode": 404, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "invite code not found"})}

        partner_id = str(partner[0])
        if partner_id == user_id:
            cur.close()
            conn.close()
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "cannot chat with yourself"})}

        a, b = sorted([user_id, partner_id])
        cur.execute("SELECT id FROM chats WHERE user_a = %s AND user_b = %s", (a, b))
        existing = cur.fetchone()
        if existing:
            cur.close()
            conn.close()
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"id": str(existing[0]), "partner_id": partner_id, "partner_name": partner[1]})}

        cur.execute("INSERT INTO chats (user_a, user_b) VALUES (%s, %s) RETURNING id", (a, b))
        chat_id = str(cur.fetchone()[0])
        conn.commit()
        cur.close()
        conn.close()

        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"id": chat_id, "partner_id": partner_id, "partner_name": partner[1]})}

    return {"statusCode": 405, "headers": CORS, "body": "Method Not Allowed"}
