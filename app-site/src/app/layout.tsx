import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "./site-header";

export const metadata: Metadata = {
  title: {
    default: "Metroplist",
    template: "%s | Metroplist",
  },
  description:
    "Explore places, populations and comparisons across the world.",
  metadataBase: new URL("https://app.metroplist.com"),
  manifest: "/assets/favicons/grey_teal/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/assets/favicons/grey_teal/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/assets/favicons/grey_teal/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/assets/favicons/grey_teal/favicon.ico",
        sizes: "any",
      },
    ],
    apple: [
      {
        url: "/assets/favicons/grey_teal/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
