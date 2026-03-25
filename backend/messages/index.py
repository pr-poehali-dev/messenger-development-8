"""
Messages API: история сообщений в чате и отправка новых (текст и фото).
GET  /?chat_id=...&since_id=0   — получить сообщения
POST /                          — отправить сообщение
  body: {chat_id, sender_id, text?, image_url?}
"""

import json
import os
import base64
import uuid
import boto3
import psycopg2
from datetime import timezone


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID", "")


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
            SELECT m.id, m.sender_id, u.name, m.text, m.image_url, m.created_at
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
                "image_url": r[4],
                "created_at": r[5].astimezone(timezone.utc).isoformat(),
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
        image_b64 = (body.get("image_base64") or "").strip()
        content_type = (body.get("content_type") or "image/jpeg").strip()

        if not chat_id or not sender_id or (not text and not image_b64):
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "chat_id, sender_id and text or image_base64 are required"})}

        image_url = None
        if image_b64:
            image_data = base64.b64decode(image_b64)
            ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
            key = f"chat-images/{chat_id}/{uuid.uuid4()}.{ext}"
            s3 = boto3.client(
                "s3",
                endpoint_url="https://bucket.poehali.dev",
                aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
            )
            s3.put_object(Bucket="files", Key=key, Body=image_data, ContentType=content_type)
            image_url = f"https://cdn.poehali.dev/projects/{ACCESS_KEY}/bucket/{key}"

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO chat_messages (chat_id, sender_id, text, image_url) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
            (chat_id, sender_id, text or None, image_url or None)
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
                    "image_url": image_url or None,
                    "created_at": row[1].astimezone(timezone.utc).isoformat(),
                })}

    return {"statusCode": 405, "headers": CORS, "body": "Method Not Allowed"}