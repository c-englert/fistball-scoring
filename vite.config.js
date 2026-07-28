import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // no stuck old versions
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Fistball Scoring",
        short_name: "Scoring",
        description: "Game report / súmula entry for fistball tournaments.",
        theme_color: "#3a2d6b",
        background_color: "#eef1f6",
        display: "standalone",
        orientation: "landscape",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
