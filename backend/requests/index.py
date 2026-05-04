import json
import os
import psycopg2
import urllib.request

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p86571260_money_miner_game")
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
ADMIN_CHAT_ID = os.environ.get("TELEGRAM_ADMIN_CHAT_ID", "")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def tg_send(text: str, reply_markup: dict = None) -> int:
    """Отправляет сообщение в Telegram, возвращает message_id."""
    payload = {"chat_id": ADMIN_CHAT_ID, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup)
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read())
    return result.get("result", {}).get("message_id")


def handler(event: dict, context) -> dict:
    """API для заявок на пополнение и вывод средств."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")

    # GET /requests — список заявок для админ-панели
    if method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id, user_id, type, amount, card, status, comment, created_at
                FROM {SCHEMA}.requests ORDER BY created_at DESC LIMIT 100"""
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        requests_list = [
            {
                "id": r[0],
                "user_id": r[1],
                "type": r[2],
                "amount": float(r[3]),
                "card": r[4],
                "status": r[5],
                "comment": r[6],
                "created_at": r[7].isoformat(),
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"requests": requests_list})}

    # POST /requests — создать заявку
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        req_type = body.get("type")  # deposit | withdraw
        amount = float(body.get("amount", 0))
        card = body.get("card", "")
        user_id = body.get("user_id", "anonymous")

        if req_type not in ("deposit", "withdraw") or amount <= 0:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "invalid params"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""INSERT INTO {SCHEMA}.requests (user_id, type, amount, card, status)
                VALUES (%s, %s, %s, %s, 'pending') RETURNING id""",
            (user_id, req_type, amount, card),
        )
        req_id = cur.fetchone()[0]
        conn.commit()

        # Уведомление в Telegram
        type_label = "💰 ПОПОЛНЕНИЕ" if req_type == "deposit" else "💸 ВЫВОД"
        card_line = f"\n💳 Карта: <code>{card}</code>" if card else ""
        text = (
            f"{type_label} #{req_id}\n"
            f"👤 Пользователь: {user_id}\n"
            f"💵 Сумма: <b>{amount:,.0f} ₽</b>"
            f"{card_line}\n"
            f"⏳ Статус: ожидает подтверждения"
        )
        markup = {
            "inline_keyboard": [
                [
                    {"text": "✅ Одобрить", "callback_data": f"approve:{req_id}"},
                    {"text": "❌ Отклонить", "callback_data": f"reject:{req_id}"},
                ]
            ]
        }
        msg_id = tg_send(text, markup)

        # Сохраняем message_id для последующего редактирования
        cur.execute(
            f"UPDATE {SCHEMA}.requests SET tg_message_id=%s WHERE id=%s",
            (msg_id, req_id),
        )
        conn.commit()
        cur.close()
        conn.close()

        return {"statusCode": 200, "headers": cors, "body": json.dumps({"id": req_id, "status": "pending"})}

    return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "method not allowed"})}
