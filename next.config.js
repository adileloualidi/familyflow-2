/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Export statique : tout est genere en HTML/JS pur, hebergeable sur Cloudflare
  // Pages (ou n'importe quel hebergeur statique) sans serveur Node necessaire.
  // L'app ne fait que du client-side (Firebase Auth/Firestore directement depuis
  // le navigateur), donc aucune fonctionnalite n'est perdue.
  output: "export",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
