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
      <head>
        {/*
          Source Serif for display, Source Sans for body, loaded as a
          stylesheet rather than through next/font. display=swap means
          text renders immediately in the system fallback and reflows
          when the webfont lands, which matters when many users are on
          slow mobile connections.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font --
            That rule targets the Pages Router, where a per-page font
            link only applies to one page. This is the App Router root
            layout, so it is global. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Work+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body className="bg-ink flex min-h-full flex-col">{children}</body>
    </html>
  );
}
