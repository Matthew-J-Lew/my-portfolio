// app/page.tsx
import HeroSection from "@/components/heroSection";
import AboutSection from "@/components/aboutSection";
import ProjectsSection from "@/components/projectsSection";
import ExperienceSection from "@/components/ExperienceSection";
import ContactSection from "@/components/contactSection";
import SectionHashSync from "@/components/SectionHashSync"; // ← add this

export default function Home() {
  return (
    <main className="text-white">
      {/* Mount once, anywhere on the page */}
      <SectionHashSync />

      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ExperienceSection />
      <ContactSection />
    </main>
  );
}
