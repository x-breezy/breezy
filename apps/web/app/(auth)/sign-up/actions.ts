"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

interface ActionState {
  error: string | null
}

export async function signUpAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  let token: string

  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost"}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })

    const body = await res.json()

    if (!res.ok) {
      return { error: body.message ?? "Something went wrong." }
    }

    token = body.data.token
  } catch {
    return { error: "Could not reach the server." }
  }

  const cookieStore = await cookies()
  cookieStore.set("breezy-token", token, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    httpOnly: false,
  })

  redirect("/")
}
