import HeroSection from "@/components/heroSection";
import AboutSection from "@/components/aboutSection";
import ProjectsSection from "@/components/projectsSection";
import ExperienceSection from "@/components/experience/ExperienceSection";
import ContactSection from "@/components/contactSection";

export default function Home() {
  return (
    <main className="bg-[#121212] text-white">
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ExperienceSection />
      <ContactSection />
    </main>
  );
}
