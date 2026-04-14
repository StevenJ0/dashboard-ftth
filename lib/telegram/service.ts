const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramNotification(message: string) {
  if (!BOT_TOKEN || !CHAT_ID) {
    if (process.env.NODE_ENV !== 'production') {
       console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    }
    return;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML", 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Telegram Error:", errorData);
    }
  } catch (error) {
    console.error("❌ Failed to send Telegram notification:", error);
  }
}

export const telegramService = {
  sendTelegramMessage: async (chatId: string | number, text: string) => {
    const token = BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TELEGRAM_BOT_TOKEN is not set");
      return false;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send Telegram message:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending Telegram message:", error);
      return false;
    }
  },
};