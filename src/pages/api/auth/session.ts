import { NextApiRequest, NextApiResponse } from "next";
import { jwtVerify } from "jose";
import { parse } from "cookie";
import { supabase } from "@/src/lib/supabase";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-at-least-32-chars-long"
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const cookies = parse(req.headers.cookie || "");
  const sessionToken = cookies.session;

  if (!sessionToken) {
    return res.status(401).json({ message: "No session found" });
  }

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    
    // Fetch latest profile data to ensure telegramChatId is current
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, telegran_chat_id")
      .eq("id", payload.id as string)
      .maybeSingle();

    if (profileError) {
      console.error("[Session API] Profile fetch error:", profileError);
    }

    const user = {
      ...payload,
      name: profile?.name || (payload as any).name || "Usuário",
      telegramChatId: profile?.telegran_chat_id
    };

    return res.status(200).json(user);
  } catch (error) {
    return res.status(401).json({ message: "Invalid session" });
  }
}
