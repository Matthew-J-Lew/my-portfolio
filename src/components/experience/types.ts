export type MediaItem = { alt: string; src: string };

export type EmploymentType =
  | "internship"
  | "co-op"
  | "fulltime"
  | "contract"
  | "part-time";

export type ExperienceItem = {
  id: string;
  org: string;
  role: string;
  logoSrc?: string;
  start: string;              // e.g., "Sep 2025"
  end: string;                // e.g., "Present" or "Aug 2024"
  location?: string;
  impact?: string;
  bullets?: string[];
  media?: MediaItem[];
  status?: "default" | "current" | "upcoming";
  light?: boolean;

  employmentType?: EmploymentType; // e.g., "internship" | "co-op"
  durationLabel?: string;          // e.g., "16-month Co-op"
};
