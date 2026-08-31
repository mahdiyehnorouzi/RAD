/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ["@rad/ui", "@rad/types"],
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${process.env.API_URL || "http://localhost:4000"}/:path*`,
      },
    ];
  },
};
