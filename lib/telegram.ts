export async function sendTelegramMessage(message: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    if (process.env.NODE_ENV !== 'production') {
       console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    }
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown", 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Telegram API Error:", errorData);
    }
  } catch (error) {
    console.error("❌ Failed to send Telegram notification:", error);
  }
}
