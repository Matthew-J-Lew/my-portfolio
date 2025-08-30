export const categories = [
  "Programming Languages",
  "Web & Cloud",
  "Database",
  "DevOps & Tools",
] as const;
export type Category = typeof categories[number];

export interface Skill {
  id: number;
  name: string;
  iconSrc?: string;   // SVG under /public/icons
  category: Category;
  core?: boolean;     // show at the front of the gallery
}

export const skills: Skill[] = [
  // Programming Languages
  { id: 1,  name: "TypeScript", iconSrc: "/icons/typescript.svg", category: "Programming Languages", core: true },
  { id: 2,  name: "JavaScript", iconSrc: "/icons/javascript.svg", category: "Programming Languages", core: true },
  { id: 3,  name: "Python",     iconSrc: "/icons/python.svg",     category: "Programming Languages", core: true },
  { id: 4,  name: "Java",       iconSrc: "/icons/java.svg",       category: "Programming Languages" },
  { id: 5,  name: "C/C++",      iconSrc: "/icons/cpp.svg",        category: "Programming Languages" },
  { id: 6,  name: "Rust",       iconSrc: "/icons/rust.svg",       category: "Programming Languages" },

  // Web & Cloud
  { id: 7, name: "HTML",     iconSrc: "/icons/html5.svg",   category: "Web & Cloud" }, 
  { id: 8, name: "CSS",      iconSrc: "/icons/css3.svg",    category: "Web & Cloud" },
  { id: 9, name: "React",    iconSrc: "/icons/react.svg",   category: "Web & Cloud", core: true },
  { id: 10, name: "Next.js",  iconSrc: "/icons/nextjs.svg",  category: "Web & Cloud", core: true },
  { id: 11, name: "Node.js",  iconSrc: "/icons/nodejs.svg",  category: "Web & Cloud", core: true },
  { id: 12, name: "Tailwind", iconSrc: "/icons/tailwind.svg",     category: "Web & Cloud" },
  { id: 13, name: "AWS",      iconSrc: "/icons/aws.svg",     category: "Web & Cloud" },
  
  // Data & Databases
  { id: 14, name: "SQL",        iconSrc: "/icons/sql.svg",     category: "Database", core: true },
  { id: 15, name: "MySQL",      iconSrc: "/icons/mysql.svg",   category: "Database" },
  { id: 16, name: "PostgreSQL", iconSrc: "/icons/postgresql.svg", category: "Database" },
  { id: 17, name: "Pandas",     iconSrc: "/icons/pandas.svg",  category: "Database" },

  // Tools & Practices
  { id: 18, name: "Docker",         iconSrc: "/icons/docker.svg",        category: "DevOps & Tools" },
  { id: 19, name: "Azure DevOps",         iconSrc: "/icons/azuredevops.svg",  category: "DevOps & Tools" },
  { id: 20, name: "Git",           iconSrc: "/icons/git.svg",          category: "DevOps & Tools", core: true },
];
