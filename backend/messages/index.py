"""
Messages API: история сообщений, отправка текста/фото/аудио/видео, реакции.
GET  /?chat_id=...&since_id=0           — получить сообщения с реакциями
POST / body {chat_id, sender_id, ...}   — отправить сообщение
POST / body {action:"react", message_id, user_id, emoji} — toggle-реакция
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
            SELECT m.id, m.sender_id, u.name, m.text, m.image_url, m.audio_url, m.video_url, m.created_at
            FROM chat_messages m
            JOIN users u ON u.id = m.sender_id
            WHERE m.chat_id = %s AND m.id > %s
            ORDER BY m.id ASC
            LIMIT 100
        """, (chat_id, since_id))
        rows = cur.fetchall()

        msg_ids = [r[0] for r in rows]
        reactions_map = {}
        if msg_ids:
            ids_str = ",".join(str(i) for i in msg_ids)
            cur.execute(f"""
                SELECT message_id, emoji, COUNT(*) as cnt,
                       array_agg(user_id::text) as user_ids
                FROM message_reactions
                WHERE message_id IN ({ids_str})
                GROUP BY message_id, emoji
            """)
            for rr in cur.fetchall():
                mid = rr[0]
                if mid not in reactions_map:
                    reactions_map[mid] = []
                reactions_map[mid].append({"emoji": rr[1], "count": rr[2], "user_ids": rr[3]})

        cur.close()
        conn.close()

        messages = [
            {
                "id": r[0],
                "sender_id": str(r[1]),
                "sender_name": r[2],
                "text": r[3],
                "image_url": r[4],
                "audio_url": r[5],
                "video_url": r[6],
                "created_at": r[7].astimezone(timezone.utc).isoformat(),
                "reactions": reactions_map.get(r[0], []),
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"messages": messages})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")

        # Toggle-реакция
        if body.get("action") == "react":
            message_id = body.get("message_id")
            user_id = (body.get("user_id") or "").strip()
            emoji = (body.get("emoji") or "").strip()
            if not message_id or not user_id or not emoji:
                return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                        "body": json.dumps({"error": "message_id, user_id and emoji are required"})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id FROM message_reactions WHERE message_id = %s AND user_id = %s AND emoji = %s",
                        (message_id, user_id, emoji))
            existing = cur.fetchone()
            if existing:
                cur.execute("DELETE FROM message_reactions WHERE message_id = %s AND user_id = %s AND emoji = %s",
                            (message_id, user_id, emoji))
                action = "removed"
            else:
                cur.execute("INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (%s, %s, %s)",
                            (message_id, user_id, emoji))
                action = "added"
            conn.commit()
            cur.close()
            conn.close()
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"action": action})}

        chat_id = (body.get("chat_id") or "").strip()
        sender_id = (body.get("sender_id") or "").strip()
        text = (body.get("text") or "").strip()[:2000]
        image_b64 = (body.get("image_base64") or "").strip()
        audio_b64 = (body.get("audio_base64") or "").strip()
        video_b64 = (body.get("video_base64") or "").strip()
        content_type = (body.get("content_type") or "image/jpeg").strip()

        if not chat_id or not sender_id or (not text and not image_b64 and not audio_b64 and not video_b64):
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "chat_id, sender_id and content are required"})}

        s3 = boto3.client(
            "s3",
            endpoint_url="https://bucket.poehali.dev",
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        )

        image_url = None
        if image_b64:
            data = base64.b64decode(image_b64)
            ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
            key = f"chat-images/{chat_id}/{uuid.uuid4()}.{ext}"
            s3.put_object(Bucket="files", Key=key, Body=data, ContentType=content_type)
            image_url = f"https://cdn.poehali.dev/projects/{ACCESS_KEY}/bucket/{key}"

        audio_url = None
        if audio_b64:
            data = base64.b64decode(audio_b64)
            ct = body.get("content_type") or "audio/webm"
            ext = ct.split("/")[-1].split(";")[0]
            key = f"chat-audio/{chat_id}/{uuid.uuid4()}.{ext}"
            s3.put_object(Bucket="files", Key=key, Body=data, ContentType=ct)
            audio_url = f"https://cdn.poehali.dev/projects/{ACCESS_KEY}/bucket/{key}"

        video_url = None
        if video_b64:
            data = base64.b64decode(video_b64)
            ct = body.get("content_type") or "video/webm"
            ext = ct.split("/")[-1].split(";")[0]
            key = f"chat-video/{chat_id}/{uuid.uuid4()}.{ext}"
            s3.put_object(Bucket="files", Key=key, Body=data, ContentType=ct)
            video_url = f"https://cdn.poehali.dev/projects/{ACCESS_KEY}/bucket/{key}"

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO chat_messages (chat_id, sender_id, text, image_url, audio_url, video_url) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at",
            (chat_id, sender_id, text or None, image_url, audio_url, video_url)
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
                    "image_url": image_url,
                    "audio_url": audio_url,
                    "video_url": video_url,
                    "created_at": row[1].astimezone(timezone.utc).isoformat(),
                })}

    return {"statusCode": 405, "headers": CORS, "body": "Method Not Allowed"}