"""
Auth API: регистрация пользователя по имени, вход по user_id из localStorage.
POST /register — создать пользователя, вернуть id и invite_code
GET  /?user_id=... — получить профиль пользователя
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

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        name = (body.get("name") or "").strip()[:100]
        if not name:
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "name is required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (name) VALUES (%s) RETURNING id, name, invite_code",
            (name,)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"id": str(row[0]), "name": row[1], "invite_code": row[2]})}

    if method == "GET":
        params = event.get("queryStringParameters") or {}
        user_id = params.get("user_id", "")
        if not user_id:
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "user_id is required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, name, invite_code FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {"statusCode": 404, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "user not found"})}

        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"id": str(row[0]), "name": row[1], "invite_code": row[2]})}

    return {"statusCode": 405, "headers": CORS, "body": "Method Not Allowed"}
