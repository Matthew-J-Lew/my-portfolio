// components/contact/ContactSection.tsx
"use client";

import LedBorder from "./contact/LedBorder";
import QuickActions from "./contact/QuickActions";
import ContactForm from "./contact/ContactForm";
import ProfileCard from "./contact/ProfileCard";
import { CONTACT } from "@/config/contact";
import { track } from "@/lib/analytics";

export default function ContactSection({ id = "contact" }: { id?: string }) {
  return (
    <section id={id} aria-label="Contact" className="bg-[#0b0b0c] text-white">
      {/* ABOVE THE FOLD */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-screen grid grid-cols-1 md:grid-cols-2 gap-10 items-center py-16">
        {/* Left: LED circle with headline + quick actions */}
        <div className="flex justify-center md:justify-start">
          <LedBorder
            size="clamp(420px, 64vmin, 820px)"
            thickness={6}
            gap={0}              // 👈 flush: ring hugs the panel
            spinSec={10}
            glowSec={10}
            className="shadow-[0_0_40px_-10px_rgba(56,189,248,0.35)]"
          >
            <div className="max-w-sm text-center px-3">
              <p className="text-[10px] tracking-[0.28em] uppercase text-white/60 mb-2">
                Reach Out
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold leading-tight">
                Let’s build something great.
              </h2>
              <p className="mt-3 text-sm text-white/80">
                Open to internships, research, and full-stack SWE roles. I love
                building with TypeScript, React, and Python.
              </p>
              <QuickActions />
            </div>
          </LedBorder>
        </div>

        {/* Right: Profile Card */}
        <div className="flex justify-center md:justify-end">
          <ProfileCard
            avatarUrl={CONTACT.avatarSrc}
            miniAvatarUrl={CONTACT.avatarSrc}
            name={CONTACT.name}
            title={`${CONTACT.role} — ${CONTACT.location}`}
            handle={CONTACT.email}
            status="Online"
            showUserInfo
            enableTilt
            enableMobileTilt
            contactText="Contact"
            onContactClick={() => {
              // scroll to form
              const form = document.getElementById("contact-form");
              if (form)
                form.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="max-w-sm w-full"
          />
        </div>
      </div>

      {/* BELOW THE FOLD */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-screen grid place-items-center py-16">
        <div className="w-full" id="contact-form">
          <ContactForm />
          {/* Footer placeholder slot */}
          <div className="h-16" />
        </div>
      </div>
    </section>
  );
}
