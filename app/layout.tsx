import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

import { Providers } from "@/components/providers";
import { AI } from "./action";

const meta = {
  title: "CHEF GPT",
  description: "din personliga assistent för ledarskap",
};
export const metadata: Metadata = {
  ...meta,
  title: {
    default: "CHEF GPT",
    template: `%s -din personliga assistent för ledarskap`,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  twitter: {
    ...meta,
    card: "summary_large_image",
    site: "@vercel",
  },
  openGraph: {
    ...meta,
    locale: "en-US",
    type: "website",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}
      >
        <Toaster />
        <AI>
          <Providers
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <main className="flex flex-col flex-1 px-4">{children}</main>
            </div>
          </Providers>
        </AI>
        <Analytics />
      </body>
    </html>
  );
}

export const runtime = "edge";
