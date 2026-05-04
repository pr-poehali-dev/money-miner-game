import json
import os
import psycopg2
import urllib.request

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p86571260_money_miner_game")
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
ADMIN_CHAT_ID = os.environ.get("TELEGRAM_ADMIN_CHAT_ID", "")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def tg_answer_callback(callback_query_id: str, text: str):
    payload = json.dumps({"callback_query_id": callback_query_id, "text": text}).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{BOT_TOKEN}/answerCallbackQuery",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    urllib.request.urlopen(req, timeout=10)


def tg_edit_message(chat_id, message_id: int, text: str):
    payload = json.dumps({
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML",
    }).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{BOT_TOKEN}/editMessageText",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """Вебхук Telegram-бота: обрабатывает одобрение/отклонение заявок."""
    cors = {"Access-Control-Allow-Origin": "*"}

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    raw_body = event.get("body") or "{}"
    if isinstance(raw_body, str):
        parsed = json.loads(raw_body)
        body = json.loads(parsed) if isinstance(parsed, str) else parsed
    else:
        body = raw_body
    callback_query = body.get("callback_query")

    if not callback_query:
        return {"statusCode": 200, "headers": cors, "body": "ok"}

    callback_id = callback_query["id"]
    from_id = str(callback_query["from"]["id"])
    data = callback_query.get("data", "")
    message = callback_query.get("message", {})
    message_id = message.get("message_id")

    # Проверяем что нажимает именно админ
    if from_id != str(ADMIN_CHAT_ID):
        tg_answer_callback(callback_id, "⛔ Нет доступа")
        return {"statusCode": 200, "headers": cors, "body": "ok"}

    parts = data.split(":")
    if len(parts) != 2 or parts[0] not in ("approve", "reject"):
        tg_answer_callback(callback_id, "Неверная команда")
        return {"statusCode": 200, "headers": cors, "body": "ok"}

    action = parts[0]
    req_id = int(parts[1])
    new_status = "approved" if action == "approve" else "rejected"

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""UPDATE {SCHEMA}.requests SET status=%s, updated_at=NOW()
            WHERE id=%s RETURNING type, amount, card, user_id, tg_message_id""",
        (new_status, req_id),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not row:
        tg_answer_callback(callback_id, "Заявка не найдена")
        return {"statusCode": 200, "headers": cors, "body": "ok"}

    req_type, amount, card, user_id, tg_msg_id = row
    type_label = "💰 ПОПОЛНЕНИЕ" if req_type == "deposit" else "💸 ВЫВОД"
    status_label = "✅ ОДОБРЕНО" if new_status == "approved" else "❌ ОТКЛОНЕНО"
    card_line = f"\n💳 Карта: <code>{card}</code>" if card else ""
    new_text = (
        f"{type_label} #{req_id}\n"
        f"👤 Пользователь: {user_id}\n"
        f"💵 Сумма: <b>{amount:,.0f} ₽</b>"
        f"{card_line}\n"
        f"{status_label}"
    )

    if tg_msg_id:
        tg_edit_message(ADMIN_CHAT_ID, tg_msg_id, new_text)

    notify_text = "✅ Заявка одобрена!" if new_status == "approved" else "❌ Заявка отклонена"
    tg_answer_callback(callback_id, notify_text)

    return {"statusCode": 200, "headers": cors, "body": "ok"}