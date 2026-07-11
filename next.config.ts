import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dukascopy-node is a Node library (it downloads + decompresses bi5 files) and
  // its validator lazily require()s optional deps like prettier. Keep it external
  // so the bundler doesn't try to resolve those at build time; it loads from
  // node_modules at runtime on the nodejs route.
  serverExternalPackages: ["dukascopy-node"],
};

export default nextConfig;
