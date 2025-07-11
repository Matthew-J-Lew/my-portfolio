import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata = {
  title: "Matthew Lew Portfolio",
  description: "Personal developer portfolio site",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative bg-white text-black">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
