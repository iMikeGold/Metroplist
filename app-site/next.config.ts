import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      "privacy",
      "cookies",
      "terms",
      "accessibility",
      "contact",
      "responsible-data-use",
      "licensing",
      "data-quality",
      "corrections",
      "data-and-trust",
    ].map((slug) => ({
      source: `/${slug}`,
      destination: `https://metroplist.com/${slug}/`,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/embed/snapshot/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors https:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
