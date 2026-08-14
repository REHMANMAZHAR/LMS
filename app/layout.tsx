import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talha CIE 2027 Study System",
  description:
    "A private four-subject Cambridge IGCSE study planner and parent progress dashboard for Talha.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
