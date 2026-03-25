"""
Upload Avatar API: загружает фото пользователя в S3, сохраняет URL в БД.
POST / — body: {user_id, image_base64, content_type}
GET  /?user_id=... — получить актуальный профиль с avatar_url
"""

import json
import os
import base64
import boto3
import psycopg2


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
        user_id = params.get("user_id", "")
        if not user_id:
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "user_id is required"})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, name, invite_code, avatar_url FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "user not found"})}
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"id": str(row[0]), "name": row[1], "invite_code": row[2], "avatar_url": row[3]})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        user_id = (body.get("user_id") or "").strip()
        image_b64 = (body.get("image_base64") or "").strip()
        content_type = (body.get("content_type") or "image/jpeg").strip()

        if not user_id or not image_b64:
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "user_id and image_base64 are required"})}

        image_data = base64.b64decode(image_b64)

        ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        key = f"avatars/{user_id}.{ext}"

        s3 = boto3.client(
            "s3",
            endpoint_url="https://bucket.poehali.dev",
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        )
        s3.put_object(Bucket="files", Key=key, Body=image_data, ContentType=content_type)

        avatar_url = f"https://cdn.poehali.dev/projects/{ACCESS_KEY}/bucket/{key}"

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE users SET avatar_url = %s WHERE id = %s", (avatar_url, user_id))
        conn.commit()
        cur.close()
        conn.close()

        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"avatar_url": avatar_url})}

    return {"statusCode": 405, "headers": CORS, "body": "Method Not Allowed"}
