// components/projects/projects.ts

// --- Tech + Project data structures -----------------------------------------
// Tech items drive both the cube logos and the small tag chips. If `showInTags`
// is explicitly false, we still show the icon on the cube, but we omit it from
// the inline tag list under the cube (useful for generic concepts like
// “MachineLearning” that aren’t a literal tool in the stack).
export type TechItem = {
  name: string;
  icon: string;
  /** If false, this tech will NOT appear in the tag list under the cube. Defaults to true. */
  showInTags?: boolean;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  images: { src: string; alt: string }[];
  tech: TechItem[];
  links?: {
    github?: string;
    demo?: string;
    devpost?: string;
  };


  // explicit project kind
  kind: "personal" | "professional" | "hackathon";

  // optional extras
  role?: string;
  impact?: string;

  // injected for left-side jump nav
  allTitles?: { title: string; slug: string }[];
};

// --- Project catalog ---------------------------------------------------------
// Each entry provides carousel images, tech icons, and optional links.
// Keep `tech` focused on tools/libraries; set `showInTags:false` for concepts
// that shouldn’t appear in the tag chips.
export const projects: Project[] = [
  {
    id: "zoomer",
    slug: "zoomer",
    title: "Zoomer",
    tagline: "Accessible AI Meeting Bot",
    description:
      "An AI-powered meeting assistant that joins Zoom calls, captures live transcripts, and delivers searchable, timestamped summaries, playback, and Q&A for accessible mid-meeting support and post-meeting review.",
    images: [
      { src: "/images/projects/zoomer/homepage.png", alt: "Homepage of Zoomer" },
      { src: "/images/projects/zoomer/meeting.png", alt: "In-meeting view of Zoomer" },
      { src: "/images/projects/zoomer/mid-meeting-question.png", alt: "Mid-meeting question view of Zoomer" },
      { src: "/images/projects/zoomer/post-meeting-view.png", alt: "Post-meeting view of Zoomer" },
      { src: "/images/projects/zoomer/summary-and-questions.png", alt: "Post-meeting summary and questions of Zoomer" },
    ],
    tech: [
      { name: "Next.js", icon: "/icons/nextjs.svg" },
      { name: "FastAPI", icon: "/icons/fastapi.svg" },
      { name: "TypeScript", icon: "/icons/typescript.svg" },
      { name: "Python", icon: "/icons/python.svg" },
      { name: "Google Gemini", icon: "/icons/gemini.svg" },
      { name: "Recall.ai", icon: "/icons/recall.svg" },
    ],
    links: { github: "https://github.com/Matthew-J-Lew/zoomer",
              devpost: "https://devpost.com/software/zoomer-1jocnf"
     },
    kind: "hackathon",
    role: "Hackathon Project",
    impact: "Makes online meetings more inclusive by providing private, accessible tools and chat support for neurodivergent users, participants with social anxiety, and ESL individuals.",
  },
  {
    id: "causecompass",
    slug: "causecompass",
    title: "Cause Compass",
    tagline: "The Company Ethicality Platform for Change",
    description:
      "A full-stack platform that scores companies on different sustainability, human rights, and inclusivity practices. Utilizing AI-generated summaries to present clear, source-grounded summaries and alternatives.",
    images: [
      { src: "/images/projects/causecompass/homepage.png", alt: "Homepage of Cause Compass" },
      { src: "/images/projects/causecompass/searchpage.png", alt: "Search page of Cause Compass" },
      { src: "/images/projects/causecompass/companypage.png", alt: "Company page of Cause Compass" },
      { src: "/images/projects/causecompass/companypage2.png", alt: "Alternative companies on Cause Compass" },
    ],
    tech: [
      { name: "Next.js", icon: "/icons/nextjs.svg" },
      { name: "Supabase", icon: "/icons/supabase.svg" },
      { name: "TypeScript", icon: "/icons/typescript.svg" },
      { name: "Tailwind CSS", icon: "/icons/tailwind.svg" },
      { name: "Prisma", icon: "/icons/prisma.svg" },
      { name: "Google Gemini", icon: "/icons/gemini.svg" },
    ],
    links: { github: "https://github.com/BrandTrieu/cause-compass",
              devpost: "https://devpost.com/software/causecompass"
     },
    kind: "hackathon",
    role: "Hackathon Project",
    impact: "Helps consumers spend with purpose, showing which brands do or do not match their values, turning everyday purchases into votes for a more fair, more ethical world. ",
  },
  {
    id: "airesumetailor",
    slug: "airesumetailor",
    title: "AI Resume Tailor",
    tagline: "Full-stack tool for tailored resumes & cover letters",
    description:
      "Next.js app that analyzes resumes and job descriptions with the OpenAI API, generating targeted edits and exporting polished LaTeX/PDF documents.",
    images: [
      { src: "/images/projects/airesumetailor/homepage.png", alt: "Homepage of AI Resume Tailor" },
      { src: "/images/projects/airesumetailor/dashboard.png", alt: "Dashboard view of AI Resume Tailor" },
      { src: "/images/projects/airesumetailor/resume_tailor.png", alt: "Resume tailoring interface" },
      { src: "/images/projects/airesumetailor/examples.png", alt: "Generated sample resume" },
    ],
    tech: [
      { name: "Next.js", icon: "/icons/nextjs.svg" },
      { name: "React", icon: "/icons/react.svg" },
      { name: "JavaScript", icon: "/icons/javascript.svg" },
      { name: "Tailwind CSS", icon: "/icons/tailwind.svg" },
      { name: "Prisma", icon: "/icons/prisma.svg" },
      { name: "OpenAI", icon: "/icons/openai.svg" },
    ],
    links: { github: "https://github.com/Matthew-J-Lew/resume-tailor-app" },
    kind: "personal",
    role: "Independent Project",
    impact: "Helps job seekers produce targeted application materials in minutes.",
  },
  {
    id: "navigator-ietp",
    slug: "navigator-ietp",
    title: "Navigator IETP Application",
    tagline: "Technical publications platform for maintenance and enhancements, supporting a global fleet of 1,300+ CRJ aircraft.",
    description:
      "Maintained the customer facing Navigator IETP application (web & standalone), implementing server/database migration, and built Python utilities to encrypt and index technical publications.",
    images: [
      { src: "/images/projects/navigatorietp/login.png", alt: "IETP Login Page" },
      { src: "/images/projects/navigatorietp/landing_page.png", alt: "IETP Landing Page" },
      { src: "/images/projects/navigatorietp/viewer.png", alt: "IETP Viewer" },
    ],
    tech: [
      { name: "Java", icon: "/icons/java.svg" },
      { name: "Tomcat", icon: "/icons/tomcat.svg" },
      { name: "Maven", icon: "/icons/maven.svg" },
      { name: "Jenkins", icon: "/icons/jenkins.svg" },
      { name: "MySQL", icon: "/icons/mysql.svg" },
      { name: "Python", icon: "/icons/python.svg" },
    ],
    kind: "professional",
    role: "Professional Internship Project",
    impact: "Supported a migration that improved app stability and increased profit by 40%.",
  },
  /*
  {
    id: "adult-income-classifier",
    slug: "adult-income-classifier",
    title: "Adult Income Machine Learning Classifier",
    tagline: "End-to-end ML pipeline & model comparison",
    description:
      "A machine learning pipeline that preprocesses the Adult Census dataset, handles class imbalance (SMOTE), and compares multiple classification algorithms to predict whether an individual's income exceeds $50K per year.",
    images: [
      { src: "/images/projects/mlclassifier/class_balance_before_after.svg", alt: "Homepage of AI Resume Tailor" },
      { src: "/images/projects/mlclassifier/feature_importance_top10_rf.svg", alt: "Dashboard view of AI Resume Tailor" },
      { src: "/images/projects/mlclassifier/cm_grid.svg", alt: "Generated sample resume" },
      { src: "/images/projects/mlclassifier/roc_curves.svg", alt: "Generated sample resume" },
      { src: "/images/projects/mlclassifier/metrics_table.svg", alt: "Resume tailoring interface" },
    ],
    tech: [
      { name: "Python", icon: "/icons/python.svg" },
      { name: "Pandas", icon: "/icons/pandas.svg" },
      { name: "NumPy", icon: "/icons/numpy.svg" },
      { name: "scikit-learn", icon: "/icons/sklearn.svg" },
      { name: "Matplotlib", icon: "/icons/matplotlib.svg" },
      { name: "MachineLearning", icon: "/icons/machinelearning.svg", showInTags: false },
    ],
    links: { github: "https://github.com/Matthew-J-Lew/adult-income-classifier-ml" },
    kind: "personal",
    role: "Independent Project",
    impact: "Demonstrates data preprocessing, feature selection, model evaluation, and diagram generation on an imbalanced dataset.",
  },
  */
  {
    id: "automated-data-pipeline",
    slug: "automated-data-pipeline",
    title: "Automated Operator Data Pipeline",
    tagline: "SFTP → Python → SQL*Loader → Oracle",
    description:
      "Proposed, designed, and implemented automation for operator data loading. Python fetches csv data daily, validates count with Pandas, invokes SQL*Loader control files, writes to Oracle, and generates email reports.",
    images: [
      { src: "/images/projects/dataloadingpipeline/diagram_1.png", alt: "Pipeline Diagram 1" },
      { src: "/images/projects/dataloadingpipeline/diagram_2.png", alt: "Pipeline Diagram 2" },
    ],
    tech: [
      { name: "Python", icon: "/icons/python.svg" },
      { name: "Pandas", icon: "/icons/pandas.svg" },
      { name: "OracleSQL", icon: "/icons/oracle.svg" },
      { name: "SQL*Loader", icon: "/icons/sql.svg" },
      { name: "Bash", icon: "/icons/bash.svg" },
      { name: "Cron", icon: "/icons/cron.svg" },
    ],
    kind: "professional",
    role: "Professional Internship Project",
    impact: "Automated a manual process, eliminating human error. Saved ~5 hours per week with verifiable data integrity checks.",
  },
];

// --- Cross-link titles -------------------------------------------------------
// The details panel shows a compact list of projects you can jump to. To avoid
// duplicating that data, we derive it once here and attach it to each project.
const titles = projects.map((p) => ({ title: p.title, slug: p.slug }));
projects.forEach((p) => (p.allTitles = titles));
