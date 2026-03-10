import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/src/lib/supabase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message || !message.text) {
    return res.status(200).json({ ok: true });
  }

  const chatId = message.chat.id.toString();
  const text = message.text;

  // Check if it's a start command with a user ID
  // Format: /start <user_id>
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    if (parts.length === 2) {
      const userId = parts[1];

      try {
        // Update the user's profile with the telegran_chat_id using Admin client to bypass RLS
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ telegran_chat_id: chatId })
          .eq("id", userId);

        if (error) {
          console.error("Error updating telegran_chat_id:", JSON.stringify(error, null, 2));
        } else {
          console.log(`Successfully linked Telegram chat ${chatId} to user ${userId}`);
        }
      } catch (err) {
        console.error("Webhook processing error:", err);
      }
    }
  }

  return res.status(200).json({ ok: true });
}
