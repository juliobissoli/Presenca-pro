import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/src/lib/supabase";
import { serialize } from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await supabase.auth.signOut();

  res.setHeader(
    "Set-Cookie",
    serialize("session", "", {
      httpOnly: true,
      secure: true, // Required for cross-origin iframe
      sameSite: "none", // Required for cross-origin iframe
      path: "/",
      maxAge: -1, // Expire immediately
    })
  );

  return res.status(200).json({ message: "Logged out" });
}
