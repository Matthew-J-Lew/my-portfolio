// app/page.tsx
import HeroSection from "@/components/heroSection";
import AboutSection from "@/components/aboutSection";
import ProjectsSection from "@/components/projectsSection";
import ExperienceSection from "@/components/ExperienceSection";
import ContactSection from "@/components/contactSection";

export default function Home() {
  return (
    // No opaque bg here; each section controls its own background
    <main className="text-white">
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ExperienceSection />
      <ContactSection />
    </main>
  );
}
