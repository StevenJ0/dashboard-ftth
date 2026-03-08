const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramNotification(message: string) {
  console.log("BOT_TOKEN", BOT_TOKEN);
  console.log("CHAT_ID", CHAT_ID);
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("⚠️ Telegram Notification Skipped: Token or Chat ID not found in .env");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
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
    } else {
      console.log("✅ Telegram Notification Sent!");
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