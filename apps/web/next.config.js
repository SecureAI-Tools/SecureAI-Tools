// TODO: Keep these in sync with routes in web/lib/fe/routes.ts
const LOG_IN = "/log-in";
const LOG_OUT = "/log-out";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Disabled because the double renedering causes issues with chat interface!
  // TODO(TECH-DEBT): Re-enable strict mode!
  reactStrictMode: false,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [`@svgr/webpack`],
    });

    // https://github.com/wojtekmaj/react-pdf/issues/799#issuecomment-864887752
    config.resolve.alias.canvas = false;

    return config;
  },
  redirects: () => {
    return [
      {
        source: "/sign-in",
        destination: LOG_IN,
        permanent: true,
      },
      {
        source: "/signin",
        destination: LOG_IN,
        permanent: true,
      },
      {
        source: "/login",
        destination: LOG_IN,
        permanent: true,
      },
      {
        source: "/logout",
        destination: LOG_OUT,
        permanent: true,
      },
      {
        source: "/sign-out",
        destination: LOG_OUT,
        permanent: true,
      },
      {
        source: "/signout",
        destination: LOG_OUT,
        permanent: true,
      },
    ];
  },
  transpilePackages: [
    "@repo/database",
  ],
};

module.exports = nextConfig;
