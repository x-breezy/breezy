"use client"

import { useEffect } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost"
// ponytail: abort after 15s — subscribe() hangs indefinitely if FCM is slow
const SUBSCRIBE_TIMEOUT_MS = 15_000

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`push subscribe timed out after ${ms}ms`)), ms)
  )
  return Promise.race([promise, timeout])
}

async function registerPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

  const registration = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready

  const permission = await Notification.requestPermission()
  if (permission !== "granted") return

  const res = await fetch(`${API_URL}/api/notifications/push/vapid-key`)
  const { publicKey } = await res.json()

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await withTimeout(
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      }),
      SUBSCRIBE_TIMEOUT_MS
    )
  }

  await fetch(`${API_URL}/api/notifications/push/subscribe`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  })
}

export function usePushNotifications() {
  useEffect(() => {
    registerPush().catch((err) => console.warn("[push]", err.message))
  }, [])
}
