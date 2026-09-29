/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: false },
  // PILOT vit dans un sous-dossier du dépôt de l'appli bar : sa racine est ce dossier.
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

module.exports = nextConfig;
