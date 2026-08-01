import type { Metadata } from "next";
import { InstitutionalFooter } from "@/components/institutional-footer";
import { InstitutionalHeader } from "@/components/institutional-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metroplist | Map Everything. Understand Anything.",
  description:
    "Metroplist is a living data intelligence platform exploring the relationships between people, places, systems, and ideas.",
  metadataBase: new URL("https://metroplist.com"),
  manifest: "/assets/favicons/monochrome/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/assets/favicons/monochrome/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png"
      },
      {
        url: "/assets/favicons/monochrome/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      }
    ],
    apple: [
      {
        url: "/assets/favicons/monochrome/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  },
  openGraph: {
    title: "Metroplist",
    description:
      "A living atlas of connected data, visual intelligence, research stories, and relationships hidden inside information.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <InstitutionalHeader />
        {children}
        <InstitutionalFooter />
      </body>
    </html>
  );
}
