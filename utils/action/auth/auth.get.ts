"use server"

import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { User } from "@/utils/types/user.types";
import axios from "axios";

interface AuthResult {
  user: User;
  token: string;
}



export const auth = cache(async (): Promise<AuthResult | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;

  if (!token) return null;

  try {
    const { data } = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/user-service/get-user-from-token`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const payload  = data?.payload;

    const user : User  | null = payload?.user;
    if (!data?.success || !user) return null;
    return {
      user,
      token
    };
  } catch (error) {
    console.error("auth error:", error);
    return null;
  }
});

/**
 * requireAuth() — mirrors Auth.js's protect() pattern:
 *   - calls auth() internally
 *   - redirects to /login if no session
 *   - returns guaranteed non-null AuthResult
 *   - use this in pages that always need a user
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}