import { User } from "@/src/types";

export async function getSession(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/session");
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Falha ao entrar");
  }

  return await response.json();
}

export async function signup(email: string, name: string, password: string): Promise<any> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Falha ao criar conta");
  }

  return await response.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
