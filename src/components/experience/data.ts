import type { ExperienceItem } from "./types";

/**
 * Deterministic month parsing (SSR + client).
 * Accepts "Sep 2025", "September 2025", "Jun 2024", etc.
 */
const MONTH: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Convert a date label into a sortable numeric key.
 *
 * Inputs supported:
 *   - "Sep 2025" / "September 2025" (preferred)
 *   - "YYYY-MM" (fallback)
 *   - "Present" / "Current" / "Now" → pushed far into the future
 *
 * Output:
 *   - y * 12 + m, so standard numeric comparisons give chronological order.
 *   - For unknown strings, returns a very small number so they sort to the end.
 */
function ymKey(s: string | undefined): number {
  if (!s) return -1e9;
  const t = s.trim().toLowerCase();
  if (t === "present" || t === "current" || t === "now") return 9e9;

  // Expect "<month> <year>"
  const parts = t.split(/\s+/);
  if (parts.length >= 2) {
    const m = MONTH[parts[0]];
    const y = Number(parts[1]);
    if (Number.isFinite(m) && Number.isFinite(y)) return y * 12 + m;
  }
  // Fallback: try ISO "YYYY-MM" if you ever use it
  const iso = /^(\d{4})-(\d{1,2})$/.exec(t);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]) - 1;
    return y * 12 + (m >= 0 ? m : 0);
  }
  // Unknown -> push to the very end
  return -1e9;
}

/**
 * Raw, user-authored content for the timeline.
 * - Edit/add entries here.
 * - Keep strings simple and deterministic (no Date.now(), etc.).
 * - `media` can be images or other assets; the UI decides how to render them.
 */
const raw: ExperienceItem[] = [
    {
    id: "tmu-research-iot-2025",
    org: "Toronto Metropolitan University",
    role: "Researcher - IoT Software Security",
    start: "Sep 2025",
    end: "Present",
    location: "Toronto, ON",
    impact: "I'm exploring how AI can reshape the way we build secure software for IoT devices. My research at the CRESSET Lab focuses on using Large Language Models and Agentic AI to automate stages of the IoT software development lifecycle.",
    bullets: [
      "Designing an agentic, LLM-driven pipeline that translates natural-language IoT software specifications into structured UML state machines and JSON representation.",
      "Exploring how Agentic AI can automate and improve the safety, correctness, and reliability of IoT software development workflows.",
      "Collaborating with faculty researchers to evaluate these methods and contribute to advancing IoT security practices."
    ],
    media:[
      {alt: "The projected agentic AI pipeline.", src: "/images/experience/tmu-cresset/NLPipeline.png"},
    ],
    logoSrc: "/logos/tmu.png",
    status: "current",
  },
  {
    id: "tmu-ai-assistant-2025",
    org: "Toronto Metropolitan University",
    role: "AI Software Developer",
    start: "Sep 2025",
    end: "Present",
    location: "Toronto, ON",
    impact: "I'm currently working with the school's Faculty of Arts to design and build an AI-driven chatbot that will help students navigate their academic journey — making support more accessible, responsive, and engaging.",
    bullets: [
      "Developing a retrieval-augmented generation (RAG) chatbot to help students navigate academic programs using verified university data.",
      "Leading the design of backend APIs, retrieval logic, and evaluation pipelines for low-latency, source-grounded question answering.",
      "Partnering with academic staff and IT professionals to ensure the chatbot reflects student needs and enhances the overall experience.",
    ],
    media:[
      {alt: "The projected AI Chatbot Architecture diagram.", src: "/images/experience/tmu-arts/TMU-Chatbot.png"},
    ],
    logoSrc: "/logos/tmu.png",
    status: "current",
  },
  {
    id: "mhirj-2023-2024",
    org: "Mitsubishi Heavy Industries",
    role: "Software Developer",
    start: "May 2023",
    end: "Aug 2024",
    location: "Mississauga, ON",
    impact:
      "My first real software job. During my 16 month co-op at MHI RJ Aviation, I grew into a developer, a trusted technical support lead, and a mentor. I had the pleasure of working on everything from critical applications to automation pipelines — learning and growing at every step.",
    bullets: [
      "Took ownership of a mission-critical, customer-facing technical publications platform, leading upgrades that delivered major business value.",
      "Proposed and built a fully automated data pipeline that streamlined operations and reduced manual workload for the team.",
      "Stepped up as the main technical support contact for 190 aircraft operator companies worldwide, balancing problem solving with clear, people-first communication.",
      "Mentored incoming junior interns, providing guidance and ensuring smooth handoff of all of my responsibilities.",
    ],
    media:[
      {alt: "Me and the rest of the DAS team at the Missisauga Office.", src: "/images/experience/mhirj/team_photo.jpg"},
    ],
    logoSrc: "/logos/mhirj.jpg",
    employmentType: "co-op",
    durationLabel: "16-month Co-op",
  },
];

/**
 * Exported, sorted experiences used by the UI.
 *
 * Sort order (stable & deterministic):
 *   1) End date descending (latest end first; "Present" sorts to top)
 *   2) Start date descending (tie-breaker within same end month)
 *   3) Organization name (final, stable tie-breaker)
 *
 * Why stable sorting?
 * - Ensures identical order on server and client renders (avoids hydration diff).
 * - Keeps timeline predictable when multiple items share the same dates.
 */
export const experiences: ExperienceItem[] = [...raw].sort((a, b) => {
  const aEnd = ymKey(a.end);
  const bEnd = ymKey(b.end);
  if (aEnd !== bEnd) return bEnd - aEnd;

  const aStart = ymKey(a.start);
  const bStart = ymKey(b.start);
  if (aStart !== bStart) return bStart - aStart;

  return a.org.localeCompare(b.org); // stable tie-breaker
});
