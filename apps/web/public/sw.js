self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("push", (event) => {
  let data = { title: "New notification", body: "", type: "", url: "/notifications" }
  try {
    data = event.data?.json() ?? data
  } catch {
    data.body = event.data?.text() ?? ""
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/brand/breezy_icon.svg",
      data: { url: data.url, type: data.type },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/notifications"
  event.waitUntil(clients.openWindow(url))
})
