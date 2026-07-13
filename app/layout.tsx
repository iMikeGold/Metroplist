import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metroplist | Map Everything. Understand Anything.",
  description:
    "Metroplist is a living data intelligence platform exploring the relationships between people, places, systems, and ideas.",
  metadataBase: new URL("https://metroplist.pages.dev"),
  openGraph: {
    title: "Metroplist",
    description:
      "A public observatory for connected data, visual intelligence, research stories, and the future Metroplist intelligence engine.",
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
      <body>{children}</body>
    </html>
  );
}
