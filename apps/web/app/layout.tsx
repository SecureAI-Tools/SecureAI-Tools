"use client";

import { setup } from "twind";
import { SessionProvider } from "next-auth/react";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";

import "../styles/globals.css";

TimeAgo.addDefaultLocale(en);

setup({
  // Disables default dark mode inheriting from OS preferences!
  // Our dark mode isn't that well supported -- it is all over the place hence it is disabled for now!
  // In future, considering fully testing the app in dark mode before enabling this again.
  //
  // Reference: https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually
  darkMode: "class",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </SessionProvider>
  );
}
