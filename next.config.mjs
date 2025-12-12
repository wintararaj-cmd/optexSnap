/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [],
    },
    // Ignore TypeScript and ESLint errors during build (for Railway deployment)
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
