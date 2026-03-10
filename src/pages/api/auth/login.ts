import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/src/lib/supabase";
import { SignJWT } from "jose";
import { serialize } from "cookie";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-at-least-32-chars-long"
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Usuário não encontrado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, telegran_chat_id")
      .eq("id", data.user.id)
      .maybeSingle();

    const user = {
      id: data.user.id,
      email: data.user.email || "",
      name: profile?.name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Usuário",
      telegramChatId: profile?.telegran_chat_id,
      supabaseAccessToken: data.session?.access_token,
      supabaseRefreshToken: data.session?.refresh_token
    };

    const token = await new SignJWT(user)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    res.setHeader(
      "Set-Cookie",
      serialize("session", token, {
        httpOnly: true,
        secure: true, // Required for cross-origin iframe
        sameSite: "none", // Required for cross-origin iframe
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    );

    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(401).json({ message: error.message });
  }
}
