import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import MobileNav from "@/components/MobileNav";

import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "dropblox - Share your Roblox creations",
  description: "A social platform for Roblox developers to showcase their games and creations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen flex flex-col`}>
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <MobileNav />
        <AuthModal />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
