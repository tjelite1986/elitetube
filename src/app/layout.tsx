import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import PwaRegister from "@/components/PwaRegister";

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
};

export const metadata: Metadata = {
  title: "EliteTube",
  description: "Private self-hosted media server",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EliteTube",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-yt-bg text-yt-text min-h-screen">
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
