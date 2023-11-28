import { tw } from "twind";
import Head from "next/head";

import { PUBLIC_FACING_NAME, TWITTER_HANDLE } from "lib/core/constants";

// Layout for pages NextJS router. Do not use in new app router!
export const Layout = ({
  children,
  title = PUBLIC_FACING_NAME,
  description = PUBLIC_FACING_NAME,
  noIndex = false,
  canonicalUrl,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
}) => {
  return (
    <>
      <Head>
        <meta name="description" content={description} />
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/logo.png" />
        {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

        <meta name="viewport" content="initial-scale=1, width=device-width" />

        {/* OpenGraph metadata for link previews: Facebook, WhatsApp, Signal, LinkedIn, Slack */}
        <meta property="og:site_name" content={PUBLIC_FACING_NAME} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content={`@${TWITTER_HANDLE}`} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        {noIndex ? <meta name="robots" content="noindex" /> : null}
      </Head>

      <main className={tw("w-full h-full")}>{children}</main>
    </>
  );
};
