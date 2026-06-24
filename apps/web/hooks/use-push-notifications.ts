"use client"

import { useEffect } from "react"
import { subscribePush } from "@/lib/actions/notifications"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost"
// ponytail: abort after 15s — subscribe() hangs indefinitely if FCM is slow
const SUBSCRIBE_TIMEOUT_MS = 15_000

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`push subscribe timed out after ${ms}ms`)), ms)
  )
  return Promise.race([promise, timeout])
}

async function saveSubscription(subscription: PushSubscription) {
  try {
    const json = subscription.toJSON() as {
      endpoint: string
      keys: { auth: string; p256dh: string }
    }
    await subscribePush(json)
    console.info("[push] subscription saved to server")
  } catch (err) {
    console.warn("[push] failed to save subscription:", err)
  }
}

async function registerPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[push] serviceWorker or PushManager not available")
    return
  }

  const registration = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready
  console.info("[push] SW registered")

  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    console.warn("[push] permission not granted:", permission)
    return
  }

  const res = await fetch(`${API_URL}/api/notifications/push/vapid-key`)
  const body = await res.json()
  if (!body.publicKey) {
    console.warn("[push] no publicKey from server:", body)
    return
  }
  console.info("[push] got VAPID key, length:", body.publicKey.length)

  const existingSub = await registration.pushManager.getSubscription()
  if (existingSub) {
    console.info("[push] using existing subscription")
    await saveSubscription(existingSub)
    return
  }

  console.info("[push] subscribing...")
  const subscription = await withTimeout(
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(body.publicKey) as BufferSource,
    }),
    SUBSCRIBE_TIMEOUT_MS
  )
  console.info("[push] subscribed, endpoint:", subscription.endpoint.slice(-20))

  await saveSubscription(subscription)
}

export function usePushNotifications() {
  useEffect(() => {
    registerPush().catch((err) => console.warn("[push]", err.message))
  }, [])
}
