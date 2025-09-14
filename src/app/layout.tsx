// app/layout.tsx
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ParticlesGlobal from "@/components/background/GlobalParticles";

export const metadata = {
  title: "Matthew Lew's Portfolio",
  description: "Personal developer portfolio site",
  icons: {
      icon: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* body holds the *solid* base color only */}
      <body className="relative bg-[#0b0b0c] text-white">
        {/* Global particles sit just above the body background */}
        <ParticlesGlobal />

        {/* All site content sits above the particles */}
        <div className="relative z-10">
          <Navbar />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
