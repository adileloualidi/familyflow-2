import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

// next/font telecharge et auto-heberge la police au moment du build : aucune requete
// vers Google Fonts a l'execution, donc pas de ralentissement au chargement.
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FamilyFlow — l'organisation de la maison",
  description: "Taches, repas, courses et stock de la famille, au meme endroit.",
  applicationName: "FamilyFlow",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#171512" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={sans.variable}>
      <body className={sans.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
