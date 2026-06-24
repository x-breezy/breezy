import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Breezy",
    short_name: "Breezy",
    description: "The breeziest place to share what's on your mind.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ca3500",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
