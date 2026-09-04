import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The LAN IP changes whenever the dev machine reconnects/renews its DHCP lease — a stale
  // entry here silently blocks the dev server's JS/RSC requests from any other device on the
  // network (page loads, but nothing is interactive), so keep every IP that's shown up.
  // "Aidens-MacBook-Pro.local" (Bonjour/mDNS) is the stable alternative — browser localStorage
  // is scoped per-origin (scheme+host+port), so visiting by raw IP means every DHCP-driven IP
  // change looks like a brand new origin with empty storage: accounts and progress saved
  // under the old IP become invisible, not actually lost. Prefer the .local hostname on any
  // device that can resolve it (this never changes), and keep this array as a fallback for
  // ones that can't.
  allowedDevOrigins: ["192.168.2.27", "192.168.2.11", "Aidens-MacBook-Pro.local"],
};

export default nextConfig;
