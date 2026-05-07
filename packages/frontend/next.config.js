/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_CUSD_ADDRESS: process.env.NEXT_PUBLIC_CUSD_ADDRESS,
    NEXT_PUBLIC_TASK_MANAGER_ADDRESS: process.env.NEXT_PUBLIC_TASK_MANAGER_ADDRESS,
  },
};

module.exports = nextConfig;
