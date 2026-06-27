import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waypoint Hermes",
  description: "iMessage-first outdoor expedition agent powered by Hermes"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
