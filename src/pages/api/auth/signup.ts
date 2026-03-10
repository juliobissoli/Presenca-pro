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

  const { email, name, password } = req.body;

  try {
    const redirectUri = process.env.APP_URL ? `${process.env.APP_URL}/login` : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUri,
        data: {
          name,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Erro ao criar usuário");

    // If email confirmation is required, session will be null
    if (!data.session) {
      return res.status(201).json({ 
        message: "Confirmação de e-mail necessária",
        emailConfirmationRequired: true 
      });
    }

    const user = {
      id: data.user.id,
      email: data.user.email || "",
      name: name,
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

    return res.status(201).json(user);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}
