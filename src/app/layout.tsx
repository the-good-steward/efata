import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Efata",
  description:
    "Be opened. Practice the conversations that win the client, the interview, the offer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="bg-ink flex min-h-full flex-col">{children}</body>
    </html>
  );
}
