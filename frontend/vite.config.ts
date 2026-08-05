import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "prompt",
      injectRegister: null,

      devOptions: {
        enabled: false,
      },

      includeAssets: [
        "icons/favicon.ico",
        "icons/favicon-16x16.png",
        "icons/favicon-32x32.png",
        "icons/apple-touch-icon.png",
        "icons/icon-master-1024.png",
      ],

      manifest: {
        id: "/",
        name: "Trans 2 de Junio",
        short_name: "Trans 2 Junio",

        description:
          "Sistema PWA para la venta, reserva y validación de pasajes del Sindicato Trans 2 de Junio.",

        lang: "es",
        dir: "ltr",

        start_url: "/",
        scope: "/",

        display: "standalone",
        orientation: "portrait-primary",

        theme_color: "#07562e",
        background_color: "#07562e",

        categories: [
          "travel",
          "transportation",
          "business",
        ],

        icons: [
          {
            src: "/icons/icon-48.png",
            sizes: "48x48",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-256.png",
            sizes: "256x256",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,

        globPatterns: [
          "**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,json,woff,woff2}",
        ],

        maximumFileSizeToCacheInBytes:
          6 * 1024 * 1024,

        navigateFallback: "/index.html",

        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/auth\//,
        ],

        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === "image",

            handler: "CacheFirst",

            options: {
              cacheName:
                "trans2junio-imagenes-v1",

              expiration: {
                maxEntries: 120,
                maxAgeSeconds:
                  60 * 60 * 24 * 30,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            urlPattern: ({ request }) =>
              request.destination ===
                "script" ||
              request.destination ===
                "style" ||
              request.destination ===
                "font",

            handler: "StaleWhileRevalidate",

            options: {
              cacheName:
                "trans2junio-recursos-v1",

              expiration: {
                maxEntries: 100,
                maxAgeSeconds:
                  60 * 60 * 24 * 30,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            urlPattern: ({ request }) =>
              request.mode === "navigate",

            handler: "NetworkFirst",

            options: {
              cacheName:
                "trans2junio-paginas-v1",

              networkTimeoutSeconds: 5,

              expiration: {
                maxEntries: 30,
                maxAgeSeconds:
                  60 * 60 * 24 * 7,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],

  build: {
    cssCodeSplit: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 700,
    reportCompressedSize: true,

    rolldownOptions: {
      output: {
        /*
         * Activa la creación de archivos separados para
         * las páginas cargadas mediante React.lazy().
         */
        codeSplitting: true,

        chunkFileNames:
          "assets/[name]-[hash].js",

        entryFileNames:
          "assets/[name]-[hash].js",

        assetFileNames:
          "assets/[name]-[hash][extname]",
      },
    },
  },
});