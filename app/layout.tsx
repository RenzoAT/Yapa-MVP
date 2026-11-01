import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "yapa", description: "Club de clientes para tu local" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1E6B73" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=Figtree:wght@400;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
