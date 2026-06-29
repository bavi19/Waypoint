import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Junko",
  description: "A friendly outdoor expedition companion powered by Nous.",
  applicationName: "Junko",
  icons: {
    icon: [
      { url: "/assets/junko-logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/junko-logo-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/assets/junko-logo-180.png", sizes: "180x180", type: "image/png" }]
  },
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
