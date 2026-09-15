/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/projects", destination: "/work", permanent: true },
      { source: "/backlog", destination: "/work", permanent: true },
      { source: "/morning-review", destination: "/review", permanent: true },
      { source: "/evening-review", destination: "/review", permanent: true },
    ];
  },
};

export default nextConfig;
  