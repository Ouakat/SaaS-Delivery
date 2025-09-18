import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // Allow loading images from other domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.lorem.space",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "a0.muscache.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "storeno.b-cdn.net",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },

  // Add multi-tenant routing for Network
  async rewrites() {
    return [
      {
        source: "/platform/:platform/:path*",
        destination: "/:path*?tenant=:platform",
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_AUTH_SERVICE_URL: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
    NEXT_PUBLIC_PARCEL_SERVICE_URL: process.env.NEXT_PUBLIC_AUTH_SETTINGS_URL,

    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
};

export default withNextIntl(nextConfig);
