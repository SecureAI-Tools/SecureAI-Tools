import type { AppProps } from "next/app";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { setup } from "twind";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";

import "../styles/globals.css";
import { useEffect } from "react";
import { Analytics } from "lib/fe/analytics";

interface Props extends AppProps {
  session: Session | null | undefined;
}

TimeAgo.addDefaultLocale(en);

setup({
  // Disables default dark mode inheriting from OS preferences!
  // Our dark mode isn't that well supported -- it is all over the place hence it is disabled for now!
  // In future, considering fully testing the app in dark mode before enabling this again.
  //
  // Reference: https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually
  darkMode: "class",
});

function StudioApp({ Component, session, pageProps }: Props) {
  /* Track page views */
  useEffect(() => {
    Analytics.page({});
  }, []);

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default StudioApp;
