import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/src/lib/supabase";
import { jwtVerify } from "jose";
import { parse } from "cookie";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-at-least-32-chars-long"
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const cookies = parse(req.headers.cookie || "");
  const sessionToken = cookies.session;

  if (!sessionToken) {
    return res.status(401).json({ message: "No session found" });
  }

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userId = payload.id as string;
    const { telegramChatId } = req.body;

    // Set the session so Supabase knows who is making the request (for RLS)
    if (payload.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: payload.supabaseAccessToken as string,
        refresh_token: (payload.supabaseRefreshToken as string) || "",
      });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ telegran_chat_id: telegramChatId })
      .eq("id", userId);

    if (error) {
      console.error("Supabase error updating telegran_chat_id:", JSON.stringify(error, null, 2));
      throw error;
    }

    return res.status(200).json({ message: "Telegram Chat ID atualizado com sucesso" });
  } catch (error: any) {
    console.error("Error updating telegran_chat_id:", error);
    return res.status(500).json({ message: error.message || "Erro interno do servidor" });
  }
}
